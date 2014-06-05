using System;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using JSonConfigEditor.module;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.gui.editor;
using JSonConfigEditor.gui.popup;
using JSonConfigEditor.tree;
using JSonConfigEditor.extensions;
using JSonConfigEditor.util;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.contextMenu
{
    public partial class TreeViewContextMenu : ContextMenuStrip
    {
        private ConfigObjectTreeView treeView;

        private readonly ToolstripManager<String> TOOLSTRIP_FULL_EDIT =
            new ToolstripManager<String>();

        private readonly ToolstripManager<String> TOOLSTRIP_VALUE_EDIT =
            new ToolstripManager<String>();

        private const String ROOT = "root";

        public TreeViewContextMenu(ConfigObjectTreeView treeView)
        {            
            this.treeView = treeView;
            InitializeComponent();

            this.treeView.SelectionChanged += new EventHandler(treeView_SelectionChanged);
            
            this.treeView.ContextMenuStrip = this;

            this.Mode = EditorMode.FullEdit;

            // Disabled: copy, moveUp, moveDown
            this.TOOLSTRIP_FULL_EDIT.add(ROOT,
                this.menuPaste,
                this.menuExpand,
                this.menuCollapse,
                this.menuAddJson
            );

            // Allows everything. Collections and Objects have the same menu
            this.TOOLSTRIP_FULL_EDIT.add(new String[]{ 
                ElementUtils<ConfigObject>.GetName(),
                ElementUtils<ConfigCollection>.GetName()},
                this.menuDelete,
                this.menuCopy,
                this.menuPaste,
                this.menuMoveUp,
                this.menuMoveDown,
                this.menuExpand,
                this.menuCollapse,
                this.menuAddJson
            );

            // Disabled: collapse, expand. 
            // Integer, Numeric, Boolean, and String have the same menu
            this.TOOLSTRIP_FULL_EDIT.add(ConfigField.NAMES,
                this.menuDelete,
                this.menuCopy,
                this.menuPaste,
                this.menuMoveUp,
                this.menuMoveDown
            );

            // Readonly menus. Root, Collection, Object have the same menu
            this.TOOLSTRIP_VALUE_EDIT.add(new String[] {
                ROOT, 
                ElementUtils<ConfigObject>.GetName(),
                ElementUtils<ConfigCollection>.GetName()
            },
                this.menuExpand,
                this.menuCollapse
            );

            // Empty options for fields
            this.TOOLSTRIP_VALUE_EDIT.add(ConfigField.NAMES);

            this.Items.Clear();
        }

        private EditorMode _mode;
        public EditorMode Mode
        {
            get { return _mode; }
            set
            {
                this._mode = value;
                this.Items.Clear();
            }
        }

        #region Event Handlers
        // ======================== EVENT HANDLERS ========================
        /// <summary>
        /// Figure out which context menu to display
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void treeView_SelectionChanged(object sender, EventArgs e)
        {
            if (!this.treeView.hasSelectedNode())
            {
                return;
            }

            this.Items.Clear();

            String key;
            if (this.treeView.isSelected(treeView.Root))
            {
                key = ROOT;
            }
            else
            {
                Element element = this.treeView.getSelectedNode().Data;
                key = element.Name;
            }

            switch (Mode)
            {
                case EditorMode.FullEdit:
                    this.Items.AddRange(this.TOOLSTRIP_FULL_EDIT.get(key));
                    break;
                case EditorMode.ValueEdit:
                    this.Items.AddRange(this.TOOLSTRIP_VALUE_EDIT.get(key));
                    break;
                default:
                    // Error
                    break;
            }
        }
        #endregion // End event region
    }


}
