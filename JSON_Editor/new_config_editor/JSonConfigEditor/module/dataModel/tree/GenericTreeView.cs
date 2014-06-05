using System;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.Threading;
using System.Drawing;
using System.Collections.ObjectModel;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Aga.Controls.Tree;
using Aga.Controls.Tree.NodeControls;
using JSonConfigEditor.extensions;
using JSonConfigEditor.tree;
using JSonConfigEditor.module;
using JSonConfigEditor.util;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.dataModel
{
    public delegate void TreeStateChangeHandler(object sender, TreeStateChangeArg arg);

    /// <summary>
    /// Uses TreeViewAdv from online. No official API, but has a quite useful, searchable
    /// discussion forum: http://sourceforge.net/p/treeviewadv/discussion/?source=navbar
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public abstract class GenericTreeView<T> : TreeViewAdv where T : IDeepCloneable<T>, INodeData<T>
    {
        private readonly GenericTreeModel<T> _model = new GenericTreeModel<T>();
        private readonly GenericNode<T> _root = new GenericNode<T>("(root)");
        private readonly ReversibleActionManager ACTION_MANAGER = new ReversibleActionManager();
        private readonly Font FONT = new Font(System.Drawing.FontFamily.GenericSansSerif, 16);

        public GenericTreeView()
        {
            initRoot();

            NodeIcon icon = getNodeIcon();
            icon.DataPropertyName = "Image";
            //icon.ScaleMode = ImageScaleMode.Fit;
            NodeControls.Add(icon);

            NodeTextBox textBox = new NodeTextBox();
            textBox.DataPropertyName = "Text";
            textBox.DrawText += new EventHandler<DrawEventArgs>(nodeTextBox_DrawText);
            //textBox.Font = FONT;
            NodeControls.Add(textBox);

            this.Model = _model;

            _model.Children.Add(Root);
            setSelectedNode(Root);
            SelectedNode.Expand();

            this.AutoRowHeight = true;
            this.SelectionMode = Aga.Controls.Tree.TreeSelectionMode.MultiSameParent;
            this.ShowNodeToolTips = true;
            this.DisplayDraggingNodes = true;
            this.AllowDrop = true;

            // Need to set to false so search runs properly,
            // otherwise, need to implement custom search
            this.LoadOnDemand = false;

            this.ItemDrag += new System.Windows.Forms.ItemDragEventHandler(tree_ItemDrag);
            this.DragDrop += new System.Windows.Forms.DragEventHandler(tree_DragDrop);
            this.DragOver += new System.Windows.Forms.DragEventHandler(tree_DragOver);
        }

        public event TreeStateChangeHandler TreeStateChanged;
        protected virtual void onTreeStateChange(TreeStateChangeArg arg)
        {
            if (TreeStateChanged != null)
            {
                TreeStateChanged(this, arg);
            }
        }

        #region Convenience getters/setters
        /// <summary>
        /// Returns the TreeNodeAdv associated with the given GenericNode&lt;T&gt;.
        /// </summary>
        /// <param name="node"></param>
        /// <returns></returns>
        public TreeNodeAdv getTreeNodeAdv(GenericNode<T> node)
        {
            TreePath path = _model.GetPath(node);
            return FindNode(path);
        }

        protected GenericNode<T> getNode(TreeNodeAdv node)
        {
            return node.Tag as GenericNode<T>;
        }
        /// <summary>
        /// Sets the given GenericNode &lt;T&gt; as the selected node in the tree (note the
        /// given node must first be added to the model of this tree). Returns
        /// the TreeNodeAdv associated with the given node (will return null
        /// if the given node has not been added to the model of this tree).
        /// </summary>
        /// <param name="node"></param>
        /// <returns></returns>
        public TreeNodeAdv setSelectedNode(GenericNode<T> node)
        {
            TreeNodeAdv tna = getTreeNodeAdv(node);

            if (tna != null)
            {
                ClearSelection();
                ScrollTo(tna);
                tna.IsSelected = true;

            }

            return tna;
        }

        /// <summary>
        /// Returns the SelectedNode as a GenericNode instead of a 
        /// TreeNodeAdv object.
        /// </summary>
        /// <returns></returns>
        public GenericNode<T> getSelectedNode()
        {
            if (hasSelectedNode())
            {
                return getNode(SelectedNode);
            }
            return null;
        }

        /// <summary>
        /// Returns the SelectedNodes as a List of GenericNode instead of a
        /// list of TreeNodeAdv.
        /// </summary>
        /// <returns></returns>
        public ReadOnlyCollection<GenericNode<T>> getSelectedNodes()
        {
            List<GenericNode<T>> nodes = new List<GenericNode<T>>();
            SelectedNodes.ForEach((TreeNodeAdv node) =>
            {
                nodes.Add(getNode(node));
            });
            return new ReadOnlyCollection<GenericNode<T>>(nodes);
        }
        #endregion

        #region Public Properties
        /// <summary>
        /// The root node of this GenericTreeView.
        /// </summary>
        public new GenericNode<T> Root
        {
            get { return this._root; }
        }

        /// <summary>
        /// The ReversibleActionManager for this GenericTreeView that enables
        /// undo and redo of methods in this GenericTreeView.
        /// </summary>
        public ReversibleActionManager ActionManager
        {
            get { return this.ACTION_MANAGER; }
        }

        private TreeState _treeState;
        public TreeState State
        {
            set
            {
                if (_treeState != value)
                {
                    _treeState = value;
                    onTreeStateChange(new TreeStateChangeArg(value));
                }
            }
            get
            {
                return _treeState;
            }
        }
        #endregion

        #region Public Tree Operators
        /// <summary>
        /// Add a GenericNode<T> (with the given name as Text and the given value as Tag) as a 
        /// child of the SelectedNode.
        /// </summary>
        /// <param name="name"></param>
        /// <param name="value"></param>
        /// <returns>The newly created GenericNode<T> that was added to the tree.</returns>
        public GenericNode<T> add(String name, T value)
        {
            return add(getSelectedNode(), name, value);
        }

        /// <summary>
        /// Adds a child GenericNode<T> with the given key and value to the given node.
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="name"></param>
        /// <param name="value"></param>
        /// <exception cref="ArgumentException">if the given node contains a field or if 
        /// a node with the same key already exists.</exception>
        /// <returns></returns>
        public GenericNode<T> add(GenericNode<T> parent, String name, T value)
        {
            // Sets the parent to the be selected node or the root node if no 
            // node is selected.
            parent = (parent == null) ? this.Root : parent;
            GenericNode<T> newNode = new GenericNode<T>(name);
            newNode.Data = value;

            return add(parent, newNode);
        }

        public GenericNode<T> add(GenericNode<T> parent, GenericNode<T> newNode)
        {
            // Sets the parent to the be selected node or the root node if no 
            // node is selected.
            parent = (parent == null) ? this.Root : parent;
            Action action = getAddAction(parent, newNode, -1);
            Action reverseAction = getRemoveAction(newNode);

            this.ACTION_MANAGER.performReversableAction(action, reverseAction);

            State = TreeState.Modified;
            return newNode;
        }

        /// <summary>
        /// Removes the given node (and all its children) from the tree. 
        /// </summary>
        /// <param name="node"></param>
        /// <exception cref="ArgumentException">if the given node is the root node.</exception>
        public void remove(GenericNode<T> node)
        {
            Action action = getRemoveAction(node);
            Action reverseAction = getAddAction(node.Parent, node, node.Index);

            this.ACTION_MANAGER.performReversableAction(action, reverseAction);
            State = TreeState.Modified;
        }

        /// <summary>
        /// Moves the given node up by one on the TreeView. Does nothing if the
        /// given node is the only child.
        /// </summary>
        /// <param name="node">The node to move</param>
        public void moveUp(GenericNode<T> node)
        {
            ACTION_MANAGER.performReversableAction(getMoveUpAction(node), getMoveDownAction(node));
            State = TreeState.Modified;
        }

        public void moveDown(GenericNode<T> node)
        {
            ACTION_MANAGER.performReversableAction(getMoveDownAction(node), getMoveUpAction(node));
            State = TreeState.Modified;
        }

        /// <summary>
        /// Copies the given GenericNode<T> and its entire subtree. Unlike the clone() method
        /// provided by TreeView, this method also copies the Tag associated with each
        /// GenericNode<T>.
        /// </summary>
        /// <param name="node">The node to be cloned.</param>
        /// <returns>A new node that is deep copied from the given node.</returns>
        public GenericNode<T> deepClone(GenericNode<T> node)
        {
            // Deep clone the GenericNode<T>
            GenericNode<T> cloned = node.deepClone();

            return cloned;
        }
        #endregion

        #region Miscellaneous Public Methods
        /// <summary>
        /// Returns true if the given GenericNode is selected.
        /// </summary>
        /// <param name="node"></param>
        /// <returns></returns>
        public Boolean isSelected(GenericNode<T> node)
        {
            return getTreeNodeAdv(node).IsSelected;
        }

        /// <summary>
        /// Returns true if at least one GenericNode<T> in this Tree is selected.
        /// </summary>
        /// <returns></returns>
        public Boolean hasSelectedNode()
        {
            return SelectedNode != null;
        }

        public String getCompatibleChildName(GenericNode<T> parent, String preferredName)
        {
            String newName = preferredName;
            int i = 2;
            while (parent.hasChild(newName))
            {
                newName = String.Format("{0} ({1})", preferredName, i);
                i++;
            }
            return newName;
        }

        /// <summary>
        /// Returns true if node1 is equal to node2. Two nodes are considered 
        /// equal if the the given predicate returns true, they have the same 
        /// number of children, and each child in the order they appear in the 
        /// children list are also equal.
        /// </summary>
        /// <param name="node1"></param>
        /// <param name="node2"></param>
        /// <returns></returns>
        public Boolean equal(GenericNode<T> node1, GenericNode<T> node2,
            Func<GenericNode<T>, GenericNode<T>, Boolean> predicate)
        {
            /*
             * The two nodes must be the same, they must
             * have the same number of children, and this method 
             * also returns true for each child.
             */
            return predicate(node1, node2)
                && (node1.Children.Count == node2.Children.Count)

                // Map takes one element from each list and calls predicate on the elements. 
                // So map takes two list of elements and returns a list of booleans
                // Then All is used to make sure all the booleans are true.
                && Utils.map<GenericNode<T>, GenericNode<T>, Boolean>(
                node1.GetChildren(), node2.GetChildren(),
                (n1, n2) => predicate(n1, n2)).All((a_bool) => a_bool);
        }

        #endregion

        #region Protected Virtual (overridable) "get action" methods
        // Subclasses can override these methods to customize tree operations

        /// <summary>
        /// Adds the given child to the given parent. 
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="child"></param>
        /// <exception cref="ArgumentException">if the parent node contains a field 
        /// or if a child node with the same Text as the given child already exists.
        /// </exception>
        /// <returns></returns>
        protected virtual Action getAddAction(GenericNode<T> parent, GenericNode<T> child, int index)
        {
            /*
             * There is no need to check if the parent is null because
             * every node except the Root has a parent, and the Root will 
             * never be removed (if all operations are performed via
             * the add and remove methods). 
             */
            return () =>
            {
                if (parent.Data is ConfigField)
                {
                    throw new ArgumentException("Cannot add child to field!");
                }

                /*
                else if (hasChild(parent, child.Text))
                {
                    throw new ArgumentException("A child with name: " + child.Text + " already exists!");
                }*/
                child.Text = getCompatibleChildName(parent, child.Text);
                if (index >= 0)
                {
                    parent.Children.Insert(index, child);
                }
                else
                {
                    parent.Children.Add(child);
                }
                child.Parent = parent;
                //parent.ExpandAll();
            };
        }

        /// <summary>
        /// Returns an Action that can be called to remove the given node
        /// from the tree.
        /// </summary>
        /// <param name="node">The node to remove from this GenericTreeView</param>
        /// <returns></returns>
        protected virtual Action getRemoveAction(GenericNode<T> node)
        {
            /* 
             * Note the input checking is performed BEFORE returning
             * the action, this way, if any inputs are invalid, the exception 
             * will be thrown when calling this method, instead of being thrown 
             * when the returned action is called. This is important because 
             * if the input checking is placed inside the returned action 
             * the exception will not be known until the action is called. The way the
             * ReversibleActionManager is setup, either way works, however this
             * way is a bit more efficient since the exception is thrown early.
             */
            if (node == this._root)
            {
                throw new ArgumentException("Cannot remove root node");
            }

            return () =>
            {
                node.Parent.Children.Remove(node);
                node.Parent = null;
            };
        }

        protected virtual Action getMoveUpAction(GenericNode<T> node)
        {
            return () =>
            {
                GenericNode<T> parent = node.Parent;
                if (parent != null)
                {
                    int index = parent.Children.IndexOf(node);
                    if (index > 0)
                    {
                        parent.Children.RemoveAt(index);
                        parent.Children.Insert(index - 1, node);

                        // bw : add this line to restore the originally selected node as selected
                        setSelectedNode(node);
                    }
                }
            };
        }

        protected virtual Action getMoveDownAction(GenericNode<T> node)
        {
            return () =>
            {
                GenericNode<T> parent = node.Parent;
                if (parent != null)
                {
                    int index = parent.Children.IndexOf(node);
                    if (index < parent.Children.Count - 1)
                    {
                        parent.Children.RemoveAt(index);
                        parent.Children.Insert(index + 1, node);

                        // bw : add this line to restore the originally selected node as selected
                        setSelectedNode(node);
                    }
                }
            };
        }
        #endregion

        #region Handles Drag/Drop events
        private void tree_ItemDrag(object sender, ItemDragEventArgs e)
        {
            DoDragDropSelectedNodes(DragDropEffects.Move);
        }

        private void tree_DragOver(object sender, DragEventArgs e)
        {
            if (e.Data.GetDataPresent(typeof(TreeNodeAdv[])) && DropPosition.Node != null)
            {
                TreeNodeAdv[] nodes = e.Data.GetData(typeof(TreeNodeAdv[])) as TreeNodeAdv[];
                TreeNodeAdv parent = DropPosition.Node;
                if (DropPosition.Position != NodePosition.Inside)
                    parent = parent.Parent;

                foreach (TreeNodeAdv node in nodes)
                    if (!parent.isAncestor(node))
                    {
                        e.Effect = DragDropEffects.None;
                        return;
                    }

                e.Effect = e.AllowedEffect;
            }
        }

        private void tree_DragDrop(object sender, DragEventArgs e)
        {
            BeginUpdate();
            ACTION_MANAGER.beginGroup();

            TreeNodeAdv[] nodes = (TreeNodeAdv[])e.Data.GetData(typeof(TreeNodeAdv[]));
            GenericNode<T> dropNode = getNode(DropPosition.Node);
            if (DropPosition.Position == NodePosition.Inside)
            {
                nodes.ForEach((GenericNode<T> n) =>
                {
                    remove(n);
                    add(dropNode, n);
                });
                DropPosition.Node.IsExpanded = true;
            }
            else
            {
                GenericNode<T> parent = dropNode.Parent;
                GenericNode<T> nextItem = dropNode;
                if (DropPosition.Position == NodePosition.After)
                    nextItem = dropNode.NextNode;

                nodes.ForEach((GenericNode<T> node) =>
                {
                    remove(node);
                });

                int index = parent.Children.IndexOf(nextItem);
                if (index == -1)
                {
                    nodes.ForEach((GenericNode<T> item) =>
                    {
                        parent.Children.Add(item);
                    });
                }
                else
                {
                    nodes.ForEach((GenericNode<T> item) =>
                    {
                        parent.Children.Insert(index, item);
                        index++;
                    });
                }
            }

            ACTION_MANAGER.endGroup();
            EndUpdate();
        }
        #endregion

        #region Handles DrawText Events
        void nodeTextBox_DrawText(object sender, DrawEventArgs e)
        {
            e.Font = FONT;
        }
        #endregion

        protected abstract void initRoot();

        protected abstract NodeIcon getNodeIcon();
    }

    public enum TreeState
    {
        /// <summary>
        /// A state indicating the user input into the textbox is reflected
        /// in the tree view.
        /// </summary>
        Saved,
        /// <summary>
        /// A state indicating the user input into the textbox is modified and
        /// not yet reflected in the tree view. 
        /// </summary>
        Modified
    };

    public class TreeStateChangeArg : EventArgs
    {
        private readonly TreeState state;
        public TreeState NewState
        {
            get { return state; }
        }
        public TreeStateChangeArg(TreeState state)
        {
            this.state = state;
        }
    }
}
