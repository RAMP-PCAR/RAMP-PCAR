using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace JSonConfigEditor.extensions
{
    /// <summary>
    /// Extends for System.Windows.Forms.TreeNode
    /// </summary>
    public static class TreeNodeExtension
    {
        /// <summary>
        /// Moves the given node up by one on the TreeView. Does nothing if the
        /// given node is the only child.
        /// </summary>
        /// <param name="node">The node to move</param>
        public static void MoveUp(this TreeNode node)
        {
            TreeNode parent = node.Parent;
            if (parent != null)
            {
                int index = parent.Nodes.IndexOf(node);
                if (index > 0)
                {
                    parent.Nodes.RemoveAt(index);
                    parent.Nodes.Insert(index - 1, node);

                    // bw : add this line to restore the originally selected node as selected
                    node.TreeView.SelectedNode = node;
                }
            }
        }

        /// <summary>
        /// Moves the given node down by one on the TreeView. Does nothing if
        /// the given node is the only child.
        /// </summary>
        /// <param name="node">The node to move</param>
        public static void MoveDown(this TreeNode node)
        {
            TreeNode parent = node.Parent;
            if (parent != null)
            {
                int index = parent.Nodes.IndexOf(node);
                if (index < parent.Nodes.Count - 1)
                {
                    parent.Nodes.RemoveAt(index);
                    parent.Nodes.Insert(index + 1, node);

                    // bw : add this line to restore the originally selected node as selected
                    node.TreeView.SelectedNode = node;
                }
            }
        }

        /// <summary>
        /// Calls the given action on each child of the given parent. 
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="action"></param>
        public static void ForEachChild(
            this TreeNode parent, Action<TreeNode> action)
        {
            foreach (TreeNode child in parent.Nodes)
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
        public static IEnumerable<TOut> ForEachChild<TOut>(
            this TreeNode parent, Func<TreeNode, TOut> func)
        {
            return parent.GetChildren().Select(func);
        }

        /// <summary>
        /// Returns an IEnumerable over the given parent's children
        /// so extension methods can be used.
        /// </summary>
        /// <param name="parent"></param>
        /// <returns></returns>        
        public static IEnumerable<TreeNode> GetChildren(this TreeNode parent)
        {
            TreeNode[] nodeArray = new TreeNode[parent.Nodes.Count];
            parent.Nodes.CopyTo(nodeArray, 0);
            return nodeArray;
        }

        /// <summary>
        /// Returns true if the given parent TreeNode contains a child
        /// TreeNode with the given name as Text.
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="name"></param>
        /// <returns></returns>
        public static Boolean hasChild(this TreeNode parent, String name)
        {
            return parent.GetChildren().Any(
                (TreeNode a_node) => a_node.Text.Equals(name));
        }

        public static Boolean hasChild(this TreeNode parent, String name, TreeNode ignore)
        {
            return parent.GetChildren().Any(
                (TreeNode a_node) => {
                    return !a_node.Equals(ignore) && a_node.Text.Equals(name);
                });
        }
    }
}
