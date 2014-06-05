using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using Aga.Controls.Tree;
using JSonConfigEditor.extensions;
using JSonConfigEditor.tree;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.main;
using JSonConfigEditor.gui.textbox;
using JSonConfigEditor.dataModel.configElement;
using System.ComponentModel;

namespace JSonConfigEditor.gui.editor
{
    public partial class Editor<T> : UserControl where T : Element
    {
        /**
         * The character for carriage return.
         */
        protected const char RETURN = '\r';

        public virtual EditorMode Mode
        {
            get;
            set;
        }

        public ConfigurationEditor ConfigEditor
        {
            get;
            private set;
        }

        public GenericNode<Element> Node
        {
            get;
            private set;
        }

        public T Data
        {
            get;
            private set;
        }

        public virtual void setData(GenericNode<Element> node, T data)
        {
            if (this.Data != data)
            {               
                this.Node = node;
                this.Data = data;
                populate();
            }
        }

        protected Editor(ConfigurationEditor parent)
        {
            this.ConfigEditor = parent;

            // This way this component stretches to fit the window 
            // whenever the user resizes the window
            this.Dock = DockStyle.Fill;

            //this.Node = new Node(""); // Sentinel
        }

        /// <summary>
        /// DO NOT USE THIS CONSTRUCTOR.
        /// For GUI editor so it can have a no-arg constructor
        /// </summary>
        public Editor() : this(null) { }
        
        #region Abstract methods
        /// <summary>
        /// Populates the editor with the information contained in the node
        /// </summary>
        protected virtual void populate() { }
        #endregion

    }

    public enum EditorMode
    {
        /// <summary>
        /// Enables editing of everything (i.e. name, value, type, description)
        /// </summary>
        FullEdit,
        /// <summary>
        /// Enables editing of values only.
        /// </summary>
        ValueEdit
    };
}
