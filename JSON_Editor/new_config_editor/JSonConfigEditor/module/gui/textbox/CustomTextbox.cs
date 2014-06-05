using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using JSonConfigEditor.gui.label;
using JSonConfigEditor.gui.editor;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.gui.textbox
{
    /// <summary>
    /// The user can pass error messages to the OnTextSubmit event and cause
    /// the CustomTextbox to display an error icon. A state label can be
    /// binded to this CustomTextbox so the label reflects the state of the
    /// CustomTextbox.
    /// </summary>
    public class CustomTextbox<T> : TextBox where T : Element
    {
        #region Properties
        /// <summary>
        /// The label to be binded to this CustomTextbox so that the label
        /// changes depending on the state of this CustomTextbox.
        /// </summary>
        private BinaryStateLabel label;
        public BinaryStateLabel Label
        {
            set
            {
                if (value != null)
                {
                    this.label = value;
                }
            }
            get { return this.label; }
        }

        /// <summary>
        /// Displays an error icon next to the textbox whenever its error message is set
        /// to a non-empty String.
        /// </summary>
        private readonly ErrorProvider errorProvider = new ErrorProvider();

        /// <summary>
        /// Returns the ErrorProvider that displays the error icon whenever an
        /// error occurs. User can modify the properties of the ErrorProvider to
        /// customize how the error icon behaves whenever an error occurs.
        /// </summary>
        public ErrorProvider ErrorProvider
        {
            get { return this.errorProvider; }
        }

        private readonly Editor<T> editor;
        protected Editor<T> Editor
        {
            get { return editor; }
        }
        #endregion

        //private CustomTextbox() : this(null) { }
                
        public CustomTextbox(Editor<T> editor)
        {
            this.editor = editor;
            errorProvider.BlinkStyle = ErrorBlinkStyle.NeverBlink;
            errorProvider.SetIconAlignment(this, ErrorIconAlignment.MiddleLeft);

            Anchor = (AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Top);
        }

        protected override void OnTextChanged(EventArgs e)
        {
            ErrorText = null;
            if (ignore)
            {
                ignore = false;
            }
            else
            {
                base.OnTextChanged(e);
            }
            
        }
        
        private Boolean ignore = true;
        /// <summary>
        /// The next text change event will not fire (subsequent ones will fire as usual).
        /// </summary>
        public void ignoreNextTextChange()
        {
            ignore = true;
        }

        public String ErrorText
        {
            set { errorProvider.SetError(this, value); }
        }
    }
}
