namespace JSonConfigEditor.gui.popup
{
    partial class SettingsWindow
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

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.tabPage2 = new System.Windows.Forms.TabPage();
            this.checkBoxClearStackOnSave = new System.Windows.Forms.CheckBox();
            this.numericUpDownStackSize = new System.Windows.Forms.NumericUpDown();
            this.labelStackSize = new System.Windows.Forms.Label();
            this.tabControl = new System.Windows.Forms.TabControl();
            this.tabPage2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.numericUpDownStackSize)).BeginInit();
            this.tabControl.SuspendLayout();
            this.SuspendLayout();
            // 
            // tabPage2
            // 
            this.tabPage2.Controls.Add(this.checkBoxClearStackOnSave);
            this.tabPage2.Controls.Add(this.numericUpDownStackSize);
            this.tabPage2.Controls.Add(this.labelStackSize);
            this.tabPage2.Location = new System.Drawing.Point(4, 25);
            this.tabPage2.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.tabPage2.Name = "tabPage2";
            this.tabPage2.Padding = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.tabPage2.Size = new System.Drawing.Size(643, 343);
            this.tabPage2.TabIndex = 1;
            this.tabPage2.Text = "Undo/Redo";
            this.tabPage2.UseVisualStyleBackColor = true;
            // 
            // checkBoxClearStackOnSave
            // 
            this.checkBoxClearStackOnSave.AutoSize = true;
            this.checkBoxClearStackOnSave.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.checkBoxClearStackOnSave.Location = new System.Drawing.Point(13, 55);
            this.checkBoxClearStackOnSave.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.checkBoxClearStackOnSave.Name = "checkBoxClearStackOnSave";
            this.checkBoxClearStackOnSave.Size = new System.Drawing.Size(300, 29);
            this.checkBoxClearStackOnSave.TabIndex = 3;
            this.checkBoxClearStackOnSave.Text = "Clear undo/redo stack on save";
            this.checkBoxClearStackOnSave.UseVisualStyleBackColor = true;
            this.checkBoxClearStackOnSave.CheckedChanged += new System.EventHandler(this.checkBoxClearStackOnSave_CheckedChanged);
            // 
            // numericUpDownStackSize
            // 
            this.numericUpDownStackSize.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.numericUpDownStackSize.Increment = new decimal(new int[] {
            10,
            0,
            0,
            0});
            this.numericUpDownStackSize.Location = new System.Drawing.Point(244, 16);
            this.numericUpDownStackSize.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.numericUpDownStackSize.Maximum = new decimal(new int[] {
            10000,
            0,
            0,
            0});
            this.numericUpDownStackSize.Minimum = new decimal(new int[] {
            1,
            0,
            0,
            0});
            this.numericUpDownStackSize.Name = "numericUpDownStackSize";
            this.numericUpDownStackSize.Size = new System.Drawing.Size(145, 30);
            this.numericUpDownStackSize.TabIndex = 2;
            this.numericUpDownStackSize.Value = new decimal(new int[] {
            20,
            0,
            0,
            0});
            this.numericUpDownStackSize.ValueChanged += new System.EventHandler(this.numericUpDownStackSize_ValueChanged);
            // 
            // labelStackSize
            // 
            this.labelStackSize.AutoSize = true;
            this.labelStackSize.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelStackSize.Location = new System.Drawing.Point(8, 18);
            this.labelStackSize.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.labelStackSize.Name = "labelStackSize";
            this.labelStackSize.Size = new System.Drawing.Size(210, 25);
            this.labelStackSize.TabIndex = 1;
            this.labelStackSize.Text = "Undo/Redo Stack Size";
            // 
            // tabControl
            // 
            this.tabControl.Controls.Add(this.tabPage2);
            this.tabControl.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tabControl.Location = new System.Drawing.Point(0, 0);
            this.tabControl.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.tabControl.Name = "tabControl";
            this.tabControl.SelectedIndex = 0;
            this.tabControl.Size = new System.Drawing.Size(651, 372);
            this.tabControl.TabIndex = 3;
            // 
            // SettingsWindow
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(651, 372);
            this.Controls.Add(this.tabControl);
            this.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.Name = "SettingsWindow";
            this.Text = "SettingsWindow";
            this.tabPage2.ResumeLayout(false);
            this.tabPage2.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.numericUpDownStackSize)).EndInit();
            this.tabControl.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.TabPage tabPage2;
        private System.Windows.Forms.CheckBox checkBoxClearStackOnSave;
        private System.Windows.Forms.NumericUpDown numericUpDownStackSize;
        private System.Windows.Forms.Label labelStackSize;
        private System.Windows.Forms.TabControl tabControl;


    }
}