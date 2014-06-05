namespace JSonConfigEditor.gui.contextMenu
{
    partial class TreeViewContextMenu
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.menuDelete = new DeleteMenuItem(this.treeView);
            this.menuExpand = new ExpandMenuItem(this.treeView);
            this.menuCollapse = new CollapseMenuItem(this.treeView);
            this.menuCopy = new CopyMenuItem(this.treeView);
            this.menuPaste = new PasteMenuItem(this.treeView);
            this.menuMoveUp = new MoveUpMenuItem(this.treeView);
            this.menuMoveDown = new MoveDownMenuItem(this.treeView);
            this.menuAddJson = new AddJsonMenuItem(this.treeView);
            this.SuspendLayout();
            // 
            // menuDelete
            // 
            this.menuDelete.Name = "menuDelete";
            this.menuDelete.ShortcutKeys = ((System.Windows.Forms.Keys)((System.Windows.Forms.Keys.Control | System.Windows.Forms.Keys.Delete)));
            this.menuDelete.Size = new System.Drawing.Size(239, 24);
            this.menuDelete.Text = "Delete";
            this.menuDelete.ToolTipText = "Delete the selected node and all its children";
            // 
            // menuExpand
            // 
            this.menuExpand.Name = "menuExpand";
            this.menuExpand.ShortcutKeys = ((System.Windows.Forms.Keys)((System.Windows.Forms.Keys.Control | System.Windows.Forms.Keys.Oemplus)));
            this.menuExpand.Size = new System.Drawing.Size(239, 24);
            this.menuExpand.Text = "Expand";
            this.menuExpand.ToolTipText = "Expand the selected node and all its children";
            // 
            // menuCollapse
            // 
            this.menuCollapse.Name = "menuCollapse";
            this.menuCollapse.ShortcutKeys = ((System.Windows.Forms.Keys)((System.Windows.Forms.Keys.Control | System.Windows.Forms.Keys.OemMinus)));
            this.menuCollapse.Size = new System.Drawing.Size(239, 24);
            this.menuCollapse.Text = "Collapse";
            this.menuCollapse.ToolTipText = "Collapse the selected node and all its children";
            // 
            // menuCopy
            // 
            this.menuCopy.Name = "menuCopy";
            this.menuCopy.ShortcutKeys = ((System.Windows.Forms.Keys)((System.Windows.Forms.Keys.Control | System.Windows.Forms.Keys.C)));
            this.menuCopy.Size = new System.Drawing.Size(239, 24);
            this.menuCopy.Text = "Copy";
            this.menuCopy.ToolTipText = "Copies the selected node and all its children";
            // 
            // menuPaste
            // 
            this.menuPaste.Name = "menuPaste";
            this.menuPaste.ShortcutKeys = ((System.Windows.Forms.Keys)((System.Windows.Forms.Keys.Control | System.Windows.Forms.Keys.V)));
            this.menuPaste.Size = new System.Drawing.Size(239, 24);
            this.menuPaste.Text = "Paste";
            // 
            // menuMoveUp
            // 
            this.menuMoveUp.Name = "menuMoveUp";
            this.menuMoveUp.ShortcutKeys = ((System.Windows.Forms.Keys)((System.Windows.Forms.Keys.Control | System.Windows.Forms.Keys.Up)));
            this.menuMoveUp.Size = new System.Drawing.Size(239, 24);
            this.menuMoveUp.Text = "Move up";
            this.menuMoveUp.ToolTipText = "Move the selected node up by one";
            // 
            // menuMoveDown
            // 
            this.menuMoveDown.Name = "menuMoveDown";
            this.menuMoveDown.ShortcutKeys = ((System.Windows.Forms.Keys)((System.Windows.Forms.Keys.Control | System.Windows.Forms.Keys.Down)));
            this.menuMoveDown.Size = new System.Drawing.Size(239, 24);
            this.menuMoveDown.Text = "Move Down";
            this.menuMoveDown.ToolTipText = "Move the selected node one down";
            // 
            // menuAddJson
            // 
            this.menuAddJson.Name = "menuAddJson";
            this.menuAddJson.ShortcutKeys = ((System.Windows.Forms.Keys)((System.Windows.Forms.Keys.Control | System.Windows.Forms.Keys.A)));
            this.menuAddJson.Size = new System.Drawing.Size(239, 24);
            this.menuAddJson.Text = "Add Json";
            // 
            // TreeViewContextMenu
            // 
            this.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.menuDelete,
            this.menuCopy,
            this.menuPaste,
            this.menuMoveUp,
            this.menuMoveDown,
            this.menuExpand,
            this.menuCollapse,
            this.menuAddJson});
            this.Size = new System.Drawing.Size(240, 220);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.ToolStripMenuItem menuDelete;
        private System.Windows.Forms.ToolStripMenuItem menuExpand;
        private System.Windows.Forms.ToolStripMenuItem menuCollapse;
        private System.Windows.Forms.ToolStripMenuItem menuCopy;
        private System.Windows.Forms.ToolStripMenuItem menuPaste;
        private System.Windows.Forms.ToolStripMenuItem menuMoveUp;
        private System.Windows.Forms.ToolStripMenuItem menuMoveDown;
        private System.Windows.Forms.ToolStripMenuItem menuAddJson;

    }
}
