using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.dataModel;

namespace JSonConfigEditor.gui.contextMenu
{
    public class MoveDownMenuItem : TreeViewContextMenuItem
    {
        public MoveDownMenuItem(ConfigObjectTreeView treeView)
            : base(treeView)
        {
            Click += new EventHandler(Mouse_Click);
        }

        private void Mouse_Click(object sender, EventArgs e)
        {
            TreeView.moveDown(TreeView.getSelectedNode());
        }
    }

    public class MoveUpMenuItem : TreeViewContextMenuItem
    {
        public MoveUpMenuItem(ConfigObjectTreeView treeView) : base(treeView)
        {
            Click += new EventHandler(Mouse_Click);
        }

        private void Mouse_Click(object sender, EventArgs e)
        {
            TreeView.moveUp(TreeView.getSelectedNode());
        }
    }
}
