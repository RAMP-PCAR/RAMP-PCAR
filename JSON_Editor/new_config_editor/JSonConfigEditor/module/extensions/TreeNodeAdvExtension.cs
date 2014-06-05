using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using Aga.Controls.Tree;

namespace JSonConfigEditor.extensions
{
    /// <summary>
    /// Extensions used for Aga.Controls.Tree.TreeNodeAdv
    /// </summary>
    public static class TreeNodeAdvExtension
    {
        /// <summary>
        /// Returns true if this TreeNodeAdv is an ancestor of the given node.
        /// </summary>
        /// <param name="parent"></param>
        /// <param name="node"></param>
        /// <returns></returns>
        public static bool isAncestor(this TreeNodeAdv parent, TreeNodeAdv node)
        {
            if (parent == null)
            {
                return false;
            }

            while (parent != null)
            {
                if (node == parent)
                    return false;
                else
                    parent = parent.Parent;
            }
            return true;
        }

        public static void ForEach<T>(this TreeNodeAdv[] nodes, 
            Action<T> action)
        {
            foreach (TreeNodeAdv node in nodes)
            {
                action((T) node.Tag); 
            }
        }
    }
}
