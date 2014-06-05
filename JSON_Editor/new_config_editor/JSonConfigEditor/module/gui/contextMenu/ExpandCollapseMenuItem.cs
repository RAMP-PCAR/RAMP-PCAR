using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.dataModel;

namespace JSonConfigEditor.gui.contextMenu
{
    public class ExpandMenuItem : TreeViewContextMenuItem
    {
        public ExpandMenuItem(ConfigObjectTreeView treeView) : base(treeView)
        {
            Click += new EventHandler(Mouse_Click);
        }

        private void Mouse_Click(object sender, EventArgs e)
        {
            TreeView.SelectedNode.ExpandAll();
        }
    }

    public class CollapseMenuItem : TreeViewContextMenuItem
    {
        public CollapseMenuItem(ConfigObjectTreeView treeView)
            : base(treeView)
        {
            Click += new EventHandler(Mouse_Click);
        }

        private void Mouse_Click(object sender, EventArgs e)
        {
            TreeView.SelectedNode.Collapse(true);
        }
    }
}
