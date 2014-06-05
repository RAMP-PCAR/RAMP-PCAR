using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using JSonConfigEditor.module;
using JSonConfigEditor.main;

namespace JSonConfigEditor.gui.popup
{
    public partial class SettingsWindow : Form
    {
        private readonly ComponentStatePreserver STATE_PRESERVER = new ComponentStatePreserver();

        private ConfigurationEditor editor;

        public SettingsWindow(ConfigurationEditor editor)
        {
            InitializeComponent();
            this.Editor = editor;
            STATE_PRESERVER.bind("checkBox1", this.checkBoxClearStackOnSave);
            STATE_PRESERVER.bind("numericUpDown1", this.numericUpDownStackSize);
            
            try
            {
                String str = System.IO.File.ReadAllText("settings.txt");
                STATE_PRESERVER.load(JsonConvert.DeserializeObject<JToken>(str));
            }
            catch (System.IO.FileNotFoundException ex)
            {
            }
        }

        public ConfigurationEditor Editor
        {
            private get { return this.editor; }
            set {                
                if (this.editor != null)
                {
                    // Remove the handler from the previous editor
                    this.editor.FormClosing -= editor_FormClosing;
                }
                this.editor = value;
                this.editor.FormClosing += new FormClosingEventHandler(editor_FormClosing);
            }
        }

        private void editor_FormClosing(object sender, FormClosingEventArgs e)
        {
            String str = JsonConvert.SerializeObject(STATE_PRESERVER.save());
            System.IO.File.WriteAllText("settings.txt", str);
        }

        private void checkBoxClearStackOnSave_CheckedChanged(object sender, EventArgs e)
        {
            if (checkBoxClearStackOnSave.Checked)
            {
                this.Editor.AfterSave += new SaveEventHandler(Editor_OnSave);
            }
            else
            {
                this.Editor.AfterSave -= Editor_OnSave;
            }
        }

        private void Editor_OnSave(object source, SaveEventArgs args)
        {
            this.Editor.GenericTree.ActionManager.clearStack();
        }

        private void numericUpDownStackSize_ValueChanged(object sender, EventArgs e)
        {
            int newLimit;
            if (!int.TryParse(numericUpDownStackSize.Value.ToString(), out newLimit))
            {
                MessageBox.Show("Invalid limit, must be a positive integer!");
                return;
            }
            this.Editor.GenericTree.ActionManager.RedoLimit = newLimit;
            this.Editor.GenericTree.ActionManager.UndoLimit = newLimit;
        }
    }
}
