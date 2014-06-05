using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.gui.textbox;
using JSonConfigEditor.gui.editor;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.main;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.textbox
{
    public class ValueTextbox : CustomTextbox<ConfigField>
    {
        public ValueTextbox(Editor<ConfigField> editor):base(editor)
        {
            TextChanged += new EventHandler(ValueTextbox_TextChanged);
        }

        private void ValueTextbox_TextChanged(object sender, EventArgs e)
        {
            try
            {
                // Could throw an ArgumentException when setting 
                // field.Value
                Editor.Data.Value = this.Text;
                Editor.ConfigEditor.GenericTree.State = TreeState.Modified;
                ErrorText = "";                     
            }
            catch (ArgumentException ex)
            {
                ErrorText = ex.Message;
            }
        }
    }
}
