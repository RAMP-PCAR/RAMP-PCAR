using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using JSonConfigEditor.dataModel;

namespace JSonConfigEditor.gui.popup
{
    public partial class JsonInjectWindow : Form
    {
        private readonly ConfigObjectTreeView TREEVIEW;

        public JsonInjectWindow(ConfigObjectTreeView treeView)
        {
            InitializeComponent();
            this.TREEVIEW = treeView;
        }

        private void button1_Click(object sender, EventArgs e)
        {
            try
            {
                this.TREEVIEW.addJson(this.TREEVIEW.getSelectedNode(), this.textBox1.Text);
            }
            catch (ArgumentException ex)
            {
                MessageBox.Show(ex.Message);
            }
        }
    }
}
