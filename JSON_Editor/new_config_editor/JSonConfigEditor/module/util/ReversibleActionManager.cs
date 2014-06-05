using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JSonConfigEditor.module
{
    /// <summary>
    /// A stack that has limited capacity, so once the capacity is reached, the element
    /// at the bottom of the stack (i.e. the element that was first pushed into the 
    /// stack) is removed. If the limit is ever changed, and the stack contains more element
    /// than the new limit, then elements are removed from the bottom of the stack until
    /// the stack contains the same number of elements as the new limit.
    /// </summary>
    ///
    public class LimitedStack<T> : IEnumerable<T>
    {
        /// <summary>
        /// The maximum capacity of this LimitedStack.
        /// </summary>
        private int limit;

        /// <summary>
        /// A linked list to hold the elements of the stack. The front 
        /// of the list is the top of the stack. 
        /// </summary>
        private readonly LinkedList<T> LINKED_LIST;

        /// <summary>
        /// Instantiates a LimitedStack with the given limit. 
        /// </summary>
        public LimitedStack(int limit)
        {
            this.limit = limit;
            this.LINKED_LIST = new LinkedList<T>();
        }

        /// <summary>
        /// Instantiates a LimitedStack with the a limit of 20.
        /// </summary>
        public LimitedStack() : this(20) { }

        /// <summary>
        /// The number of elements in this LimitedStack
        /// </summary>
        public int Count
        {
            get { return this.LINKED_LIST.Count; }
        }

        /// <summary>
        /// The maximum capacity of this LimitedStack. If the limit is reached and
        /// a new item is pushed into the stack, the bottom element is removed.
        /// If the stack contains more element than the new limit, then elements 
        /// are removed from the bottom of the stack until the stack contains the 
        /// same number of elements as the new limit.
        /// </summary>
        public int Limit
        {
            get { return this.limit; }
            set
            {
                this.limit = value;
                // Remove elements from the stack to stay at or below the limit
                while (this.LINKED_LIST.Count > this.limit)
                {
                    this.LINKED_LIST.RemoveLast();
                }
            }
        }

        /// <summary>
        /// Returns true if the stack is empty. 
        /// </summary>
        public Boolean isEmpty()
        {
            return Count == 0;
        }

        /// <summary>
        /// Push an element into the LimitedStack. If the maximum capacity is 
        /// reached, the bottom element is removed and returned. If the maximum
        /// capacity is not reached, the default value for type T is returned (
        /// usually for Objects, the default value is null. However, for primitives
        /// the default value is different, for example, for int, the default 
        /// value is 0).
        /// </summary>
        /// <returns>
        /// The element that was removed from the bottom of the stack if the limit
        /// is reached, otherwise null. 
        /// </returns>
        public T push(T element)
        {
            T returnVal = default(T);

            if (Count > Limit)
            {
                returnVal = this.LINKED_LIST.Last.Value;
                this.LINKED_LIST.RemoveLast();
            }

            this.LINKED_LIST.AddFirst(element);

            return returnVal;
        }

        /// <summary>
        /// Removes and returns the top element of the stack. Throws an InvalidOperationException
        /// if the stack is empty.
        /// </summary>
        /// <exception cref="InvalidOperationException">
        /// if the stack is empty
        /// </exception>
        public T pop()
        {
            // Could throw Exception in peek().
            T returnVal = this.peek();
            this.LINKED_LIST.RemoveFirst();
            return returnVal;
        }

        /// <summary>
        /// Returns the top element of the stack (does NOT remove the element from the stack). 
        /// </summary>
        /// <exception cref="InvalidOperationException">
        /// if the stack is empty
        /// </exception>
        public T peek()
        {
            if (this.isEmpty())
            {
                throw new InvalidOperationException("The stack is empty");
            }
            return this.LINKED_LIST.First.Value;
        }
        
        /// <summary>
        /// Removes all elements from this LimitedStack. 
        /// </summary>
        public void clear()
        {
            this.LINKED_LIST.Clear();
        }

        public IEnumerator<T> GetEnumerator()
        {
            return this.LINKED_LIST.GetEnumerator();
        }

        System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }

    ///
    /// <summary>
    /// Enables undo/redo for applications where each action has a reverse action (i.e. a
    /// reverse action is one that does the opposite of the action). 
    /// </summary>
    /// 
    /// <example>
    /// This example demonstrates adding and subtracting 1 to a variable, and using
    ///  the ReversibleActionManager to undo and redo actions.
    /// <code>
    /// int num = 0;
    /// 
    /// Action add1 = () => {
    ///      num += 1;
    /// };
    /// 
    /// Action sub1 = () => {
    ///      num -= 1;
    /// };
    /// 
    /// ReversibleActionManager actionManager = new ReversibleActionManager();
    /// 
    /// actionManager.performReversibleAction(add1, sub1); // num will be 1
    /// actionManager.performReversibleAction(add1, sub1); // num will be 2
    /// actionManager.performReversibleAction(sub1, add1); // num will be 1
    /// 
    /// actionManager.undo(); // Undo the last action, which was subtract 1, so
    ///                       // now num will be 2
    /// 
    /// actionManager.undo(); // Undo the action before that, which was add 1, 
    ///                       // so now num will be 1
    ///                       
    /// actionManager.redo(); // Redo the action that was just undone, 
    ///                       // so now num will be 2                       
    /// </code>
    /// </example>
    ///
    public class ReversibleActionManager
    {
        private readonly LimitedStack<Action> UNDO_STACK = new LimitedStack<Action>();
        private readonly LimitedStack<Action> REDO_STACK = new LimitedStack<Action>();

        private List<Action> groupUndoActions = new List<Action>();
        private List<Action> groupRedoActions = new List<Action>();

        private Boolean Group
        {
            set;
            get;
        }

        public ReversibleActionManager()
        {
            this.Group = false;
        }

        /// <summary>
        /// Allows multiple actions to be "undone" or "redone" using one
        /// call to undo or redo respectively. This means any action passed
        /// to performReversibleAction from now till a call to endGroup are
        /// performed, however undo/redo cannot be called until endGroup is
        /// called.
        /// </summary>
        public void beginGroup()
        {
            if (Group)
            {
                throw new InvalidOperationException("endGroup was not called prior to calling this method!");
            }
            this.Group = true;
        }

        public void endGroup()
        {
            if (!Group)
            {
                throw new InvalidOperationException("beginGroup was not called prior to calling this method!");
            }
            List<Action> undoActions = groupUndoActions;
            undoActions.Reverse();
            List<Action> redoActions = groupRedoActions;

            groupUndoActions = new List<Action>();
            groupRedoActions = new List<Action>();

            this.Group = false;

            Action redoAction, undoAction = null;
            redoAction = () =>
            {
                foreach (Action action in redoActions)
                {
                    action();
                }
                this.UNDO_STACK.push(undoAction);
            };

            undoAction = () =>
            {
                foreach (Action action in undoActions)
                {
                    action();
                }
                this.REDO_STACK.push(redoAction);
            };

            this.UNDO_STACK.push(undoAction);
        }

        /// <summary>
        /// Given an action and its reverse action, performs the action. Does 
        /// ***MAGIC*** so the action can be undone and redone when necessary via the
        /// undo() and redo() methods.
        /// </summary>
        /// <param name="action">
        /// The action to be performed.
        /// </param>
        /// <param name="reverseAction">
        /// The reverse/opposite action, that can be used to "undo" the given action.
        /// </param>
        public void performReversableAction(Action action, Action reverseAction)
        {
            
            if (Group)
            {
                groupUndoActions.Add(reverseAction);
                groupRedoActions.Add(action);
                action();
            }
            else
            {
                Action redoAction, undoAction = null;

                redoAction = () =>
                {
                    action();

                    // Right now the undoAction is null, but that's fine since 
                    // we will assign it later before this method is ever called
                    UNDO_STACK.push(undoAction);
                };

                undoAction = () =>
                {
                    reverseAction();

                    REDO_STACK.push(redoAction);
                };

                // Perform the current requested action
                // The undo action is pushed into the stack here
                redoAction();
            }
            
        }

        /// <summary>
        /// The maximum number of actions that can be "undone". 
        /// </summary>
        public int UndoLimit
        {
            get { return this.UNDO_STACK.Limit; }
            set { this.UNDO_STACK.Limit = value; }
        }

        /// <summary>
        /// The maximum number of actions that can be "redone".
        /// </summary>
        public int RedoLimit
        {
            get { return this.REDO_STACK.Limit; }
            set { this.REDO_STACK.Limit = value; }
        }

        /// <summary>
        /// Clears the undo stack (i.e. cannot undo any action that occurred
        /// before the call to this method).
        /// </summary>
        public void clearUndoStack()
        {
            this.UNDO_STACK.clear();
        }

        /// <summary>
        /// Clears the redo stack (i.e. cannot redo any action that occurred
        /// before the call to this method).
        /// </summary>
        public void clearRedoStack()
        {
            this.REDO_STACK.clear();
        }

        /// <summary>
        /// Clears the redo and undo stack (i.e. cannot redo or undo any action
        /// that occurred before the call to this method).
        /// </summary>
        public void clearStack()
        {
            clearUndoStack();
            clearRedoStack();
        }

        /// <summary>
        /// Undo the last action performed and returns true. Returns false if there are no
        /// more action to undo. Calling redo right after this method will reverse this action
        /// (i.e. calling undo() then redo() will have an end result of nothing). 
        /// </summary>
        public Boolean undo()
        {
            if (Group)
            {
                throw new System.InvalidOperationException("Cannot undo while still grouping actions!");
            }
            if (this.UNDO_STACK.Count > 0)
            {
                Action action = this.UNDO_STACK.pop();
                action();
                return true;
            }
            return false;
        }

        /// <summary>
        /// Redo the last action performed and returns true. Returns false if there are no
        /// more action to redo. Calling undo right after this method will reverse this action
        /// (i.e. calling redo() then undo() will have an end result of nothing).
        /// </summary>
        public Boolean redo()
        {
            if (Group)
            {
                throw new System.InvalidOperationException("Cannot redo while still grouping actions!");
            }
            if (this.REDO_STACK.Count > 0)
            {
                Action action = this.REDO_STACK.pop();
                action();
                return true;
            }
            return false;
        }
    }
}
