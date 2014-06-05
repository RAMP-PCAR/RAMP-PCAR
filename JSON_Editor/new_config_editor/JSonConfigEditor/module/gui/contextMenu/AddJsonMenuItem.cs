using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.gui.popup;

namespace JSonConfigEditor.gui.contextMenu
{
    public class AddJsonMenuItem : TreeViewContextMenuItem
    {
        public AddJsonMenuItem(ConfigObjectTreeView treeView) : base(treeView)
        {
            Click += new EventHandler(Mouse_Click);
        }

        private void Mouse_Click(object sender, EventArgs e)
        {
            new JsonInjectWindow(TreeView).ShowDialog();
        }
    }
}
