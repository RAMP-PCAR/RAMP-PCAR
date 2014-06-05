namespace JSonConfigEditor.gui.popup
{
    partial class SearchWindow
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
            this.labelType = new System.Windows.Forms.Label();
            this.dropdownType = new System.Windows.Forms.ComboBox();
            this.labelName = new System.Windows.Forms.Label();
            this.textBoxValue = new System.Windows.Forms.TextBox();
            this.labelValue = new System.Windows.Forms.Label();
            this.textBoxName = new System.Windows.Forms.TextBox();
            this.labelVisibleText = new System.Windows.Forms.Label();
            this.dropDownVisibleText = new System.Windows.Forms.ComboBox();
            this.buttonSearch = new System.Windows.Forms.Button();
            this.labelResult = new System.Windows.Forms.Label();
            this.label1 = new System.Windows.Forms.Label();
            this.dropDownSearchMethod = new System.Windows.Forms.ComboBox();
            this.listViewResult = new System.Windows.Forms.ListView();
            this.SuspendLayout();
            // 
            // labelType
            // 
            this.labelType.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.labelType.AutoSize = true;
            this.labelType.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelType.Location = new System.Drawing.Point(12, 9);
            this.labelType.Name = "labelType";
            this.labelType.Size = new System.Drawing.Size(57, 25);
            this.labelType.TabIndex = 0;
            this.labelType.Text = "Type";
            // 
            // dropdownType
            // 
            this.dropdownType.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.dropdownType.FormattingEnabled = true;
            this.dropdownType.Location = new System.Drawing.Point(165, 10);
            this.dropdownType.Name = "dropdownType";
            this.dropdownType.Size = new System.Drawing.Size(551, 24);
            this.dropdownType.TabIndex = 1;
            this.dropdownType.SelectedIndexChanged += new System.EventHandler(this.dropdownType_SelectedIndexChanged);
            // 
            // labelName
            // 
            this.labelName.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.labelName.AutoSize = true;
            this.labelName.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelName.Location = new System.Drawing.Point(12, 42);
            this.labelName.Name = "labelName";
            this.labelName.Size = new System.Drawing.Size(64, 25);
            this.labelName.TabIndex = 0;
            this.labelName.Text = "Name";
            this.labelName.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // textBoxValue
            // 
            this.textBoxValue.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.textBoxValue.Location = new System.Drawing.Point(165, 80);
            this.textBoxValue.Name = "textBoxValue";
            this.textBoxValue.Size = new System.Drawing.Size(551, 22);
            this.textBoxValue.TabIndex = 3;
            // 
            // labelValue
            // 
            this.labelValue.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.labelValue.AutoSize = true;
            this.labelValue.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelValue.Location = new System.Drawing.Point(12, 77);
            this.labelValue.Name = "labelValue";
            this.labelValue.Size = new System.Drawing.Size(63, 25);
            this.labelValue.TabIndex = 0;
            this.labelValue.Text = "Value";
            // 
            // textBoxName
            // 
            this.textBoxName.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.textBoxName.Location = new System.Drawing.Point(165, 46);
            this.textBoxName.Name = "textBoxName";
            this.textBoxName.Size = new System.Drawing.Size(551, 22);
            this.textBoxName.TabIndex = 2;
            // 
            // labelVisibleText
            // 
            this.labelVisibleText.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.labelVisibleText.AutoSize = true;
            this.labelVisibleText.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelVisibleText.Location = new System.Drawing.Point(12, 110);
            this.labelVisibleText.Name = "labelVisibleText";
            this.labelVisibleText.Size = new System.Drawing.Size(114, 25);
            this.labelVisibleText.TabIndex = 0;
            this.labelVisibleText.Text = "Visible Text";
            // 
            // dropDownVisibleText
            // 
            this.dropDownVisibleText.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.dropDownVisibleText.FormattingEnabled = true;
            this.dropDownVisibleText.Items.AddRange(new object[] {
            "Any",
            "True",
            "False"});
            this.dropDownVisibleText.Location = new System.Drawing.Point(165, 111);
            this.dropDownVisibleText.Name = "dropDownVisibleText";
            this.dropDownVisibleText.Size = new System.Drawing.Size(551, 24);
            this.dropDownVisibleText.TabIndex = 4;
            // 
            // buttonSearch
            // 
            this.buttonSearch.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.buttonSearch.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.buttonSearch.Location = new System.Drawing.Point(626, 207);
            this.buttonSearch.Name = "buttonSearch";
            this.buttonSearch.Size = new System.Drawing.Size(88, 33);
            this.buttonSearch.TabIndex = 6;
            this.buttonSearch.Text = "Search";
            this.buttonSearch.UseVisualStyleBackColor = true;
            this.buttonSearch.Click += new System.EventHandler(this.buttonSearch_Click);
            // 
            // labelResult
            // 
            this.labelResult.AutoSize = true;
            this.labelResult.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelResult.Location = new System.Drawing.Point(12, 207);
            this.labelResult.Name = "labelResult";
            this.labelResult.Size = new System.Drawing.Size(0, 25);
            this.labelResult.TabIndex = 10;
            // 
            // label1
            // 
            this.label1.Anchor = System.Windows.Forms.AnchorStyles.Left;
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(13, 145);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(146, 25);
            this.label1.TabIndex = 0;
            this.label1.Text = "Search Method";
            // 
            // dropDownSearchMethod
            // 
            this.dropDownSearchMethod.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.dropDownSearchMethod.FormattingEnabled = true;
            this.dropDownSearchMethod.Items.AddRange(new object[] {
            "Preorder (parent then children)",
            "Postorder (IN PROGRESS, children then parent)",
            "Breadth-first (level by level)",
            "Depth-first",
            "Alphabetical"});
            this.dropDownSearchMethod.Location = new System.Drawing.Point(165, 145);
            this.dropDownSearchMethod.Name = "dropDownSearchMethod";
            this.dropDownSearchMethod.Size = new System.Drawing.Size(549, 24);
            this.dropDownSearchMethod.TabIndex = 5;
            // 
            // listViewResult
            // 
            this.listViewResult.Location = new System.Drawing.Point(18, 246);
            this.listViewResult.Name = "listViewResult";
            this.listViewResult.Size = new System.Drawing.Size(698, 257);
            this.listViewResult.TabIndex = 11;
            this.listViewResult.UseCompatibleStateImageBehavior = false;
            this.listViewResult.View = System.Windows.Forms.View.Details;
            // 
            // SearchWindow
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.AutoSize = true;
            this.ClientSize = new System.Drawing.Size(726, 515);
            this.Controls.Add(this.listViewResult);
            this.Controls.Add(this.dropDownSearchMethod);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.labelResult);
            this.Controls.Add(this.buttonSearch);
            this.Controls.Add(this.dropDownVisibleText);
            this.Controls.Add(this.labelVisibleText);
            this.Controls.Add(this.textBoxName);
            this.Controls.Add(this.labelValue);
            this.Controls.Add(this.textBoxValue);
            this.Controls.Add(this.labelName);
            this.Controls.Add(this.dropdownType);
            this.Controls.Add(this.labelType);
            this.Name = "SearchWindow";
            this.Text = "SearchWindow";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label labelType;
        private System.Windows.Forms.ComboBox dropdownType;
        private System.Windows.Forms.Label labelName;
        private System.Windows.Forms.TextBox textBoxValue;
        private System.Windows.Forms.Label labelValue;
        private System.Windows.Forms.TextBox textBoxName;
        private System.Windows.Forms.Label labelVisibleText;
        private System.Windows.Forms.ComboBox dropDownVisibleText;
        private System.Windows.Forms.Button buttonSearch;
        private System.Windows.Forms.Label labelResult;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.ComboBox dropDownSearchMethod;
        private System.Windows.Forms.ListView listViewResult;
    }
}