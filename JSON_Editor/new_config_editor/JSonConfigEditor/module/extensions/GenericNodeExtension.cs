using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using JSonConfigEditor.tree;

namespace JSonConfigEditor.extensions
{
    /// <summary>
    /// Extensions used for Aga.Controls.Tree.GenericNode<T>
    /// </summary>
    public static class GenericNodeExtension
    {
        #region Returns a boolean
        /// <summary>
        /// Returns true if the given parent GenericNode<T> contains a child
        /// GenericNode<T> with the given name as Text.
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="name"></param>
        /// <returns></returns>
        public static Boolean hasChild<T>(this GenericNode<T> parent, String name) where T : INodeData<T>
        {
            return parent.GetChildren().Any(
                (GenericNode<T> a_node) => a_node.Text.Equals(name));
        }

        /// <summary>
        /// Returns true if this node contains a child (other than the given
        /// ignore node) that has the given name.
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="name"></param>
        /// <param name="ignore"></param>
        /// <returns></returns>
        public static Boolean hasChild<T>(this GenericNode<T> parent, String name, GenericNode<T> ignore) where T : INodeData<T>
        {
            return parent.GetChildren().Any(
                (GenericNode<T> a_node) => {
                    return !a_node.Equals(ignore) && a_node.Text.Equals(name);
                });
        }

        /// <summary>
        /// Returns true if this node has at least one child.
        /// </summary>
        /// <param name="node"></param>
        /// <returns></returns>
        public static Boolean hasChildren<T>(this GenericNode<T> node) where T : INodeData<T>
        {
            return node.Children.Count > 0;
        }
        #endregion
        
        #region Iterative Functions
        /// <summary>
        /// Calls the given action on each child of the given parent. 
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="action"></param>
        public static void ForEachChild<T>(
            this GenericNode<T> parent, Action<GenericNode<T>> action) where T : INodeData<T>
        {
            foreach (GenericNode<T> child in parent.Children)
            {
                action(child);
            }
        }

        /// <summary>
        /// Calls the given function on each child of the given parent. Returns
        /// the result of the given function in an IEnumerable.
        /// </summary>
        /// <typeparam name="TOut"></typeparam>
        /// <param name="parent"></param>
        /// <param name="func"></param>
        /// <returns></returns>
        public static IEnumerable<TOut> ForEachChild<T, TOut>(
            this GenericNode<T> parent, Func<GenericNode<T>, TOut> func) where T : INodeData<T>
        {
            return parent.GetChildren().Select(func);
        }

        /// <summary>
        /// Performs pre-order traversal (parent first, then children) starting 
        /// at the given node and call the given action on each node visited by 
        /// the traversal. This means the given action will be called on the parent
        /// before the children.
        /// </summary>
        /// <param name="node"></param>
        /// <param name="action"></param>
        public static void preOrderTraversal<T>(this GenericNode<T> node,
            Action<GenericNode<T>> action) where T : INodeData<T>
        {
            Action<GenericNode<T>> helper = null;
            helper = (GenericNode<T> a_node) =>
            {
                action(a_node);
                a_node.ForEachChild((GenericNode<T> child) => helper(child));
            };
            helper(node);
        }

        /// <summary>
        /// Performs post-order traversal (children first, then parent) starting 
        /// at the given node and call the given action on each node visited by 
        /// the traversal. This means the given action will be called on the children 
        /// before the parent.
        /// </summary>
        /// <param name="node"></param>
        /// <param name="action"></param>
        public static void postOrderTraversal<T>(this GenericNode<T> node,
            Action<GenericNode<T>> action) where T : INodeData<T>
        {
            Action<GenericNode<T>> helper = null;
            helper = (GenericNode<T> a_node) =>
            {
                a_node.ForEachChild((GenericNode<T> child) => helper(child));
                action(a_node);                
            };
            helper(node);
        }

        /// <summary>
        /// Performs depth-first traversal starting at the given node and call the 
        /// given action on each node visited by the traversal. 
        /// </summary>
        /// <param name="node"></param>
        /// <param name="action"></param>
        public static void depthFirstTraversal<T>(this GenericNode<T> node,
            Action<GenericNode<T>> action) where T : INodeData<T>
        {
            Stack<GenericNode<T>> nodeQueue = new Stack<GenericNode<T>>();
            nodeQueue.Push(node);

            while (nodeQueue.Count > 0)
            {
                GenericNode<T> current = nodeQueue.Pop();
                action(current);
                current.ForEachChild((GenericNode<T> child) => nodeQueue.Push(child));
            }
        }

        /// <summary>
        /// Performs breadth-first traversal starting at the given node and call the 
        /// given action on each node visited by the traversal. 
        /// </summary>
        /// <param name="node"></param>
        /// <param name="action"></param>
        public static void breadthFirstTraversal<T>(this GenericNode<T> node,
            Action<GenericNode<T>> action) where T : INodeData<T>
        {
            Queue<GenericNode<T>> nodeQueue = new Queue<GenericNode<T>>();
            nodeQueue.Enqueue(node);

            while (nodeQueue.Count > 0)
            {
                GenericNode<T> current = nodeQueue.Dequeue();
                action(current);
                current.ForEachChild((GenericNode<T> child) => nodeQueue.Enqueue(child));
            }
        }
        #endregion

        /// <summary>
        /// Returns an IEnumerable over the given parent's children
        /// so extension methods can be used.
        /// </summary>
        /// <param name="parent"></param>
        /// <returns></returns>        
        public static IEnumerable<GenericNode<T>> GetChildren<T>(
            this GenericNode<T> parent) where T : INodeData<T>
        {
            GenericNode<T>[] nodeArray = new GenericNode<T>[parent.Children.Count];
            parent.Children.CopyTo(nodeArray, 0);
            return nodeArray;
        }

        /// <summary>
        /// Recursively clones this GenericNode<T> (i.e. subtree is also cloned). Only 
        /// the Text field is preserved in the clone.
        /// </summary>
        /// <param name="original"></param>
        /// <returns></returns>
        public static GenericNode<T> Clone<T>(this GenericNode<T> original) where T : INodeData<T>
        {
            GenericNode<T> clone = new GenericNode<T>(original.Text);
            clone.Data = original.Data;

            // Recursively clone the children (if any)
            if (original.hasChildren())
            {
                foreach (GenericNode<T> child in original.Children)
                {
                    clone.Children.Add(child.Clone());
                }
            }
            return clone;
        }

        /// <summary>
        /// Returns the first child of this GenericNode<T>. Returns null if this GenericNode<T> 
        /// does not have any children.
        /// </summary>
        /// <param name="parent"></param>
        /// <returns></returns>
        public static GenericNode<T> getFirstChild<T>(this GenericNode<T> parent) where T : INodeData<T>
        {
            if (parent.hasChildren())
            {
                return parent.Children[0];
            }
            return null;
        }

        /// <summary>
        /// Returns a List of GenericNode that belong to the path from the given start node
        /// to the root. The first element in the List is the start node, the last element in the
        /// list is the root node.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="start"></param>
        /// <returns></returns>
        public static List<GenericNode<T>> getPath<T>(this GenericNode<T> start) where T : INodeData<T>
        {
            List<GenericNode<T>> path = new List<GenericNode<T>>();
            Action<GenericNode<T>> helper = null;
            helper = (GenericNode<T> a_node) => {
                path.Add(a_node);
                if (a_node.Parent != null) {
                    helper(a_node.Parent);
                }
            };
            helper(start);
            return path;
        }
    }
}
