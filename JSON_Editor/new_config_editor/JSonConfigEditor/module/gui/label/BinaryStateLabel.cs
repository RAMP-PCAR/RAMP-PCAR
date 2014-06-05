using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace JSonConfigEditor.gui.label
{
    public enum SaveState
    {
        Saved,
        Modified
    }

    public partial class BinaryStateLabel : StateLabel<SaveState>
    {
        public BinaryStateLabel()
            : base(SaveState.Saved, new Dictionary<SaveState, String>
                {
                    {SaveState.Saved, ""},
                    {SaveState.Modified, "*"}
                })
        {
            InitializeComponent();
        }
    }
}
