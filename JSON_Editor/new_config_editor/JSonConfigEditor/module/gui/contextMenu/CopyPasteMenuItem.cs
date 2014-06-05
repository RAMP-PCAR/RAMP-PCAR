using System;
using System.Windows.Forms;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.dataModel.configElement;
using JSonConfigEditor.tree;
using JSonConfigEditor.util;
using JSonConfigEditor.extensions;
using Newtonsoft.Json;

namespace JSonConfigEditor.gui.contextMenu
{
    public class CopyMenuItem : TreeViewContextMenuItem
    {
        public const String CLIPBOARD_TYPE = "CustomJsonObject";

        public CopyMenuItem(ConfigObjectTreeView treeView)
            : base(treeView)
        {
            Click += new EventHandler(Mouse_Click);
        }

        /// <summary>
        /// Copies the selected node onto the clipboard.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void Mouse_Click(object sender, EventArgs e)
        {
            if (TreeView.isSelected(TreeView.Root))
            {
                MessageBox.Show("Cannot copy root!");
                return;
            }

            GenericNode<Element> clipBoard = new GenericNode<Element>();
            clipBoard.Data = new ConfigObject();
            ForEachSelectedNode((GenericNode<Element> node) =>
            {
                clipBoard.Children.Add(TreeView.deepClone(node));
            });

            String value = JsonConvert.SerializeObject(clipBoard.Data.getSerializableValue());
            value = JsonUtil.FormatJson(value);

            //Utils.IsSerializable(clipBoard);

            Clipboard.Clear();
            IDataObject obj = new DataObject();
            obj.SetData(System.Windows.Forms.DataFormats.Text, value);
            obj.SetData(CLIPBOARD_TYPE, clipBoard);
            Clipboard.SetDataObject(obj);
        }
    }

    public class PasteMenuItem : TreeViewContextMenuItem
    {
        public PasteMenuItem(ConfigObjectTreeView treeView)
            : base(treeView)
        {
            Click += new EventHandler(Mouse_Click);
        }

        /// <summary>
        /// Paste the node from the clipboard if any.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void Mouse_Click(object sender, EventArgs e)
        {
            /*
            IDataObject obj = Clipboard.GetDataObject();
            String[] formats = obj.GetFormats();
            String temp = formats[0];
            return;*/
            
            if (Clipboard.ContainsData(CopyMenuItem.CLIPBOARD_TYPE))
            {
                GenericNode<Element> newNode = Clipboard.GetData(CopyMenuItem.CLIPBOARD_TYPE) as GenericNode<Element>;
                ForEachSelectedNode((GenericNode<Element> node) =>
                {
                    // The parent of the newly pasted node
                    GenericNode<Element> cloneParent = node;

                    // Try to be "smart" to paste the node under the parent of the current
                    // selected node if it is a field (since you can't paste under 
                    // a field).
                    if (cloneParent.Data is ConfigField && cloneParent.Parent != null)
                    {
                        cloneParent = cloneParent.Parent;
                    }

                    try
                    {
                        newNode.ForEachChild((GenericNode<Element> element) =>
                        {
                            // Must clone the element in the clipboard, otherwise the next copy
                            // will point to the same tree nodes
                            TreeView.add(cloneParent, TreeView.deepClone(element));
                        });
                    }
                    catch (ArgumentException ex)
                    {
                        MessageBox.Show(ex.Message);
                    }
                });
            }
            else if (Clipboard.ContainsText())
            {
                String text = Clipboard.GetText();
                try
                {
                    TreeView.addJson(TreeView.getSelectedNode(), text);
                }
                catch (ArgumentException ex)
                {
                    MessageBox.Show(ex.Message);
                }
            }
            else
            {
                MessageBox.Show("No recognized format in the clipboard");
            }
        }
    }
}
