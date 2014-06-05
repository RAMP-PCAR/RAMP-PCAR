using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.gui.editor;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.tree;
using JSonConfigEditor.extensions;
using JSonConfigEditor.main;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.textbox
{
    public class NameTextbox<T> : CustomTextbox<T> where T : Element
    {
        public NameTextbox(Editor<T> editor) : base(editor)
        {
            TextChanged += new EventHandler(NameTextbox_TextChanged);
        }

        private void NameTextbox_TextChanged(object sender, EventArgs e)
        {
            // If a sibling with the same name already exists, warn the 
            // user and don't change the name
            GenericNode<Element> parent = Editor.Node.Parent;
            if (parent != null && parent.hasChild(this.Text))
            {
                this.ErrorText = "A sibling with the same name already exists!";
                return;
            }

            // Otherwise change the name and mark the program as being modified
            Editor.Node.Text = this.Text;
            Editor.ConfigEditor.GenericTree.State = TreeState.Modified;
        }
    }
}
