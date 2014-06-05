using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.gui.popup;
using JSonConfigEditor.tree;
using JSonConfigEditor.util;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.contextMenu
{
    public class DeleteMenuItem : TreeViewContextMenuItem
    {
        public DeleteMenuItem(ConfigObjectTreeView treeView) : base(treeView)
        {
            Click += new EventHandler(Mouse_Click);
        }

        private void Mouse_Click(object sender, EventArgs e)
        {
            ForEachSelectedNode((GenericNode<Element> node) =>
            {
                // Decide which node should be selected after this node gets 
                // deleted (first to either of the siblings, then to the parent)
                GenericNode<Element> newSelection =
                    Utils.returnIfNotNull(node.PreviousNode, node.NextNode, node.Parent);

                TreeView.remove(node);
                TreeView.setSelectedNode(newSelection);
            });
            
            //this.setState(STATE_MODIFIED);
        }
    }
}
