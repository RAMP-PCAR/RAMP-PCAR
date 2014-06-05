using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.dataModel;
using System.Windows.Forms;
using JSonConfigEditor.tree;
using JSonConfigEditor.extensions;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.contextMenu
{
    public class TreeViewContextMenuItem : System.Windows.Forms.ToolStripMenuItem
    {
        private readonly ConfigObjectTreeView _treeView;
        protected ConfigObjectTreeView TreeView
        {
            get { return _treeView; }
        }

        public TreeViewContextMenuItem(ConfigObjectTreeView treeView)
        {
            this._treeView = treeView;
        }

        // public TreeViewContextMenuItem() :this(null) { }
        
        /// <summary>
        /// Returns true if a click to the menu should be processed. 
        /// </summary>
        /// <returns></returns>       
        private Boolean validateClick()
        {
            // Do not do anything if the treeview is not focused
            if (!_treeView.Focused)
            {
                return false;
            }
            else if (_treeView.SelectedNode == null)
            {
                MessageBox.Show("Please select the node first.");
                return false;
            }
            return true;
        }

        /// <summary>
        /// Calls the given Action on each selected node. The 
        /// actions are grouped in the action manager. 
        /// </summary>
        /// <param name="action"></param>
        protected void ForEachSelectedNode(Action<GenericNode<Element>> action)
        {
            _treeView.BeginUpdate();
            _treeView.ActionManager.beginGroup();
            _treeView.getSelectedNodes().ForEach(action);
            _treeView.ActionManager.endGroup();
            _treeView.EndUpdate();
        }

        protected override void OnClick(EventArgs e)
        {
            if (validateClick())
            {
                base.OnClick(e);
            }
        }
    }
}
