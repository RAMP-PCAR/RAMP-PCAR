using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using Aga.Controls.Tree;
using JSonConfigEditor.main;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.tree;
using JSonConfigEditor.util;
using JSonConfigEditor.extensions;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.editor
{
    public partial class CollectionEditor : Editor<ConfigCollection>
    {
        /// <summary>
        /// DO NOT USE THIS CONSTRUCTOR, in place simply because the designer needs a 
        /// no-arg constructor.
        /// </summary>
        public CollectionEditor() : this(null) { }

        public CollectionEditor(ConfigurationEditor parent)
            : base(parent)
        {
            InitializeComponent();

            this.textBoxName.Label = this.labelName;

            this.textBoxDescription.Label = this.labelDescription;

            this.comboBoxAdd.DropDownStyle = ComboBoxStyle.DropDownList;
        }

        private void updateDropDown()
        {
            this.comboBoxAdd.Items.Clear();

            if (this.Node.hasChildren())
            {
                this.comboBoxAdd.Items.Add(this.Node.getFirstChild().Data.Name);
            }
            else
            {
                String[] options = new String[] {
                ElementUtils<FieldString>.GetName(),
                ElementUtils<FieldBoolean>.GetName(),
                ElementUtils<FieldInt>.GetName(),
                ElementUtils<FieldNumeric>.GetName(),
                ElementUtils<ConfigObject>.GetName()
            };
                foreach (String str in options)
                {
                    this.comboBoxAdd.Items.Add(str);
                }
            }
            this.comboBoxAdd.SelectedIndex = 0;
        }

        protected override void populate()
        {
            // Update all the textboxes
            this.textBoxName.ignoreNextTextChange();
            this.textBoxName.Text = Node.Text;

            this.textBoxDescription.ignoreNextTextChange();
            this.textBoxDescription.Text = Data.Description;

            updateDropDown();
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
                        break;

                    case EditorMode.ValueEdit:
                        this.textBoxName.ReadOnly = true;
                        this.textBoxDescription.ReadOnly = true;
                        break;
                }
            }
        }

        #region Button Handlers
        // ======================== BUTTON HANDLERS ========================
        private void buttonAdd_Click(object sender, EventArgs e)
        {
            GenericNode<Element> selected, first;
            selected = this.ConfigEditor.GenericTree.getSelectedNode();
            first = selected.getFirstChild();

            // Copy the first child and add it if the first child
            // exists. Otherwise, add an empty object
            if (first != null)
            {
                GenericNode<Element> clone = this.ConfigEditor.GenericTree.deepClone(first);
                this.ConfigEditor.GenericTree.clearValue(clone);
                this.ConfigEditor.GenericTree.add(selected, clone);
            }
            else
            {
                this.ConfigEditor.GenericTree.add(this.ConfigEditor.DEFAULT_NAME,
                    Element.GetElement(this.comboBoxAdd.SelectedItem.ToString()));
            }
            updateDropDown();
        }
        #endregion
    }
}
