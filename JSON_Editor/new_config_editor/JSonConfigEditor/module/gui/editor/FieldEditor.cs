using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.main;
using JSonConfigEditor.dataModel.configElement;
using JSonConfigEditor.tree;

namespace JSonConfigEditor.gui.editor
{
    public partial class FieldEditor : Editor<ConfigField>
    {
        public FieldEditor(ConfigurationEditor parent)
            : base(parent)
        {
            InitializeComponent();
            this.textBoxName.Label = this.labelName;
            this.textBoxValue.Label = this.labelValue;
            this.textBoxDescription.Label = this.labelDescription;

            this.checkBoxVisibleText.CheckedChanged += new EventHandler(checkBoxVisibleText_CheckedChanged);
            this.Dock = DockStyle.Fill;
        }

        private void checkBoxVisibleText_CheckedChanged(object sender, EventArgs e)
        {
            FieldString fieldStr = this.Data as FieldString;
            if (fieldStr != null)
            {
                fieldStr.VisibleText = this.checkBoxVisibleText.Checked;
            }
        }

        // DO NOT USE THIS CONSTRUCTOR.
        // For GUI editor so it can have a no-arg constructor
        private FieldEditor()
            : this(null)
        {
        }

        #region Overriden method from Editor
        protected override void populate()
        {
            // Update all the textboxes and comboBox to reflect the
            // properties of the field
            this.textBoxName.ignoreNextTextChange();
            this.textBoxName.Text = Node.Text;

            this.textBoxValue.ignoreNextTextChange();
            this.textBoxValue.Text = Data.Value.ToString();

            this.textBoxDescription.ignoreNextTextChange();
            this.textBoxDescription.Text = Data.Description;

            // Only show the visible text checkbox if the field is a String
            FieldString fieldStr = (Data as FieldString);
            Boolean isString = (fieldStr != null);
            if (isString)
            {
                this.checkBoxVisibleText.Checked = fieldStr.VisibleText;
            }
            this.labelVisibleText.Visible = isString;
            this.checkBoxVisibleText.Visible = isString;
        }

        public override EditorMode Mode
        {
            get { return base.Mode; }
            set
            {
                base.Mode = value;
                switch (base.Mode)
                {
                    case EditorMode.FullEdit:
                        // Enable everything
                        this.textBoxName.ReadOnly = false;
                        this.textBoxDescription.ReadOnly = false;

                        break;

                    case EditorMode.ValueEdit:
                        // Disable everything except the value textbox
                        this.textBoxName.ReadOnly = true;
                        this.textBoxDescription.ReadOnly = true;
                        break;
                }
            }
        }
        #endregion
    }
}
