using JSonConfigEditor.module;
using JSonConfigEditor.gui.label;
using JSonConfigEditor.gui.textbox;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.dataModel.configElement;
namespace JSonConfigEditor.gui.editor
{
    partial class FieldEditor
    {
        /// <summary> 
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary> 
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        private void addLabel(BinaryStateLabel label, int lineNumber)
        {
            label.AutoSize = true;  
            label.Font = LABEL_FONT;
            addControl(label, lineNumber);
        }

        private void addControl(System.Windows.Forms.Control control, int lineNumber, int column = LEFT_MARGIN)
        {                      
            control.Location = new System.Drawing.Point(column, TOP_MARGIN + lineNumber * (COMPONENT_HEIGHT + LINE_SPACING));
        
            this.Controls.Add(control);
        }

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {               
            this.SuspendLayout();

            // 
            // labelName
            // 
            this.labelName = new BinaryStateLabel();
            this.labelName.Name = "labelName";
            this.labelName.Size = new System.Drawing.Size(64, COMPONENT_HEIGHT);
            //this.labelName.TabIndex = -1;
            this.labelName.Text = "Name";
            addLabel(this.labelName, 0);

            // 
            // labelValue
            // 
            this.labelValue = new BinaryStateLabel();
            this.labelValue.Name = "labelValue";
            this.labelValue.Size = new System.Drawing.Size(64, COMPONENT_HEIGHT);
            //this.labelValue.TabIndex = -1;
            this.labelValue.Text = "Value";
            addLabel(this.labelValue, 1);

            // 
            // labelDescription
            // 
            this.labelDescription = new BinaryStateLabel();
            this.labelDescription.Name = "labelDescription";
            this.labelDescription.Size = new System.Drawing.Size(109, COMPONENT_HEIGHT);
            //this.labelDescription.TabIndex = -1;
            this.labelDescription.Text = "Description";
            addLabel(this.labelDescription, 2);

            //
            // labelVisibleText
            //
            this.labelVisibleText = new BinaryStateLabel();
            this.labelVisibleText.Name = "labelVisibleText";
            this.labelVisibleText.Size = new System.Drawing.Size(109, COMPONENT_HEIGHT);
            //this.labelVisibleText.TabIndex = -1;
            this.labelVisibleText.Text = "Visible Text";
            addLabel(this.labelVisibleText, 5);

            // 
            // textBoxName
            //             
            this.textBoxName = new NameTextbox<ConfigField>(this);
            this.textBoxName.AutoSize = true;
            this.textBoxName.Label = null;
            this.textBoxName.Name = "textBoxName";
            this.textBoxName.Size = new System.Drawing.Size(225, COMPONENT_HEIGHT);
            addControl(this.textBoxName, 0, 80);

            // 
            // textBoxValue
            //             
            this.textBoxValue = new ValueTextbox(this);
            this.textBoxValue.AutoSize = true;
            this.textBoxValue.Label = null;
            this.textBoxValue.Name = "textBoxValue";
            this.textBoxValue.Size = new System.Drawing.Size(225, COMPONENT_HEIGHT);
            this.textBoxValue.TabIndex = 1;
            addControl(this.textBoxValue, 1, 80);

            // 
            // textBoxDescription
            //             
            this.textBoxDescription = new DescriptionTextbox<ConfigField>(this);
            this.textBoxDescription.AutoSize = true;
            this.textBoxDescription.Label = null;
            this.textBoxDescription.Multiline = true;
            this.textBoxDescription.Name = "textBoxDescription";
            this.textBoxDescription.Size = new System.Drawing.Size(304, COMPONENT_HEIGHT * 2 + LINE_SPACING);
            this.textBoxDescription.TabIndex = 2;
            addControl(this.textBoxDescription, 3);

            //
            // checkBoxVisibleText
            //            
            this.checkBoxVisibleText = new System.Windows.Forms.CheckBox();
            this.checkBoxVisibleText.AutoSize = false;
            this.checkBoxVisibleText.Name = "checkBoxVisibleText";
            this.checkBoxVisibleText.Size = new System.Drawing.Size(COMPONENT_HEIGHT, COMPONENT_HEIGHT);
            this.checkBoxVisibleText.TabIndex = 3;
            this.checkBoxVisibleText.Checked = true;
            addControl(this.checkBoxVisibleText, 5, 120);

            // 
            // FieldEditor
            // 
            this.Name = "FieldEditor";
            this.Size = new System.Drawing.Size(314, 282);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private readonly int TOP_MARGIN = 10;

        private readonly int COMPONENT_HEIGHT = 25;

        private const int LEFT_MARGIN = 3;

        /// <summary>
        /// Space between each line
        /// </summary>
        private readonly int LINE_SPACING = 10;

        /// <summary>
        /// Font used for all the labels
        /// </summary>
        private readonly System.Drawing.Font LABEL_FONT = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
        
        private BinaryStateLabel labelName;
        private BinaryStateLabel labelValue;
        private BinaryStateLabel labelDescription;
        private BinaryStateLabel labelVisibleText;

        private NameTextbox<ConfigField> textBoxName;
        private ValueTextbox textBoxValue;
        private DescriptionTextbox<ConfigField> textBoxDescription;
        private System.Windows.Forms.CheckBox checkBoxVisibleText;

    }
}
