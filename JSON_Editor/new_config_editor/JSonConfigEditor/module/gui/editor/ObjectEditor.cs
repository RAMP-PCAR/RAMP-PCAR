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
using JSonConfigEditor.util;
using JSonConfigEditor.extensions;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.editor
{
    public partial class ObjectEditor : Editor<ConfigObject>
    {
        public ObjectEditor(ConfigurationEditor parent)
            : base(parent)
        {
            InitializeComponent();

            this.textBoxName.Label = this.labelName;

            this.textBoxDescription.Label = this.labelDescription;

            // This way this component stretches to fit the window 
            // whenever the user resizes the window
            this.Dock = DockStyle.Fill;

            String[] options = new String[] {
                ElementUtils<FieldString>.GetName(),
                ElementUtils<FieldBoolean>.GetName(),
                ElementUtils<FieldInt>.GetName(),
                ElementUtils<FieldNumeric>.GetName(),
                ElementUtils<ConfigObject>.GetName(),
                ElementUtils<ConfigCollection>.GetName()
            };
            foreach (String str in options)
            {
                this.comboBoxAdd.Items.Add(str);
            }            
            this.comboBoxAdd.DropDownStyle = ComboBoxStyle.DropDownList;
            this.comboBoxAdd.SelectedIndex = 0;
        }

        protected override void populate()
        {
            // Update all the textboxes
            this.textBoxName.ignoreNextTextChange();
            this.textBoxName.Text = Node.Text;

            this.textBoxDescription.ignoreNextTextChange();
            this.textBoxDescription.Text = Data.Description;
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
                        this.textBoxName.ReadOnly = false;
                        this.textBoxDescription.ReadOnly = false;
                        this.comboBoxAdd.Enabled = true;
                        this.buttonAdd.Enabled = true;
                        break;
                    case EditorMode.ValueEdit:
                        this.textBoxName.ReadOnly = true;
                        this.textBoxDescription.ReadOnly = true;
                        this.comboBoxAdd.Enabled = false;
                        this.buttonAdd.Enabled = false;
                        break;
                }
            }
        }

        #region Button Handlers
        // ======================== BUTTON HANDLERS ========================
        private void buttonAdd_Click(object sender, EventArgs e)
        {
            Element element = Element.GetElement(this.comboBoxAdd.SelectedItem.ToString());

            try
            {
                this.ConfigEditor.GenericTree.add(this.ConfigEditor.DEFAULT_NAME,
                            element);
            }
            catch (ArgumentException ex)
            {
                MessageBox.Show(ex.Message);
            }
            
        }

        #endregion
    }
}
