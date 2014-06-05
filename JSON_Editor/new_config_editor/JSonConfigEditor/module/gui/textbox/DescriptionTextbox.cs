using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.gui.textbox;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.gui.editor;
using JSonConfigEditor.main;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.textbox
{
    public class DescriptionTextbox<T> : CustomTextbox<T> where T : Element
    {
        public DescriptionTextbox(Editor<T> editor) : base(editor)
        {
            TextChanged += new EventHandler(DescriptionTextbox_TextChanged);
        }

        private void DescriptionTextbox_TextChanged(object sender, EventArgs e)
        {            
            Editor.Data.Description = this.Text;
            Editor.ConfigEditor.GenericTree.State = TreeState.Modified;
        }
    }
}
