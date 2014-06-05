using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using JSonConfigEditor.extensions;

namespace JSonConfigEditor.module
{
    public class ToolstripManager<T>
    {
        private Dictionary<T, ToolStripItem[]> TOOL_STRIPS =
            new Dictionary<T, ToolStripItem[]>();

        public ToolstripManager()
        {
        }

        public void add(T key, params ToolStripItem[] items)
        {
            this.TOOL_STRIPS.Add(key, items);
        }

        /// <summary>
        /// Adds key2 to the ToolstripManager. The value key2 points to 
        /// is the same as the value pointed to by key. 
        /// </summary>
        /// <param name="key"></param>
        /// <param name="newKeys"></param>
        public void add(T[] keys, params ToolStripItem[] items)
        {
            foreach (T k in keys) {
                add(k, items);
            }            
        }

        public ToolStripItem[] get(T key)
        {
            return this.TOOL_STRIPS[key];
        }
    }
}
