using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.extensions;
using JSonConfigEditor.tree;
using JSonConfigEditor.dataModel.configElement;
using JSonConfigEditor.util;
using Aga.Controls.Tree;

namespace JSonConfigEditor.gui.popup
{
    public partial class SearchWindow : Form
    {
        private ConfigObjectTreeView genericTree;
        private Form mainForm;

        public SearchWindow()
        {
            InitializeComponent();

            this.dropdownType.Items.AddRange(new String[] {
                "Any",
                ElementUtils<FieldString>.GetName(),
                ElementUtils<FieldBoolean>.GetName(),
                ElementUtils<FieldInt>.GetName(),
                ElementUtils<FieldNumeric>.GetName(),
                ElementUtils<ConfigObject>.GetName(),
                ElementUtils<ConfigCollection>.GetName(),
                "Any Field"
            });

            dropdownType.DropDownStyle = ComboBoxStyle.DropDownList;
            dropdownType.SelectedIndex = 0;

            dropDownVisibleText.DropDownStyle = ComboBoxStyle.DropDownList;
            dropDownVisibleText.SelectedIndex = 0;

            dropDownSearchMethod.DropDownStyle = ComboBoxStyle.DropDownList;
            dropDownSearchMethod.SelectedIndex = 0;

            // INITIALIZE LIST VIEW

            // Initialize image list
            listViewResult.SmallImageList = new ImageList();
            Action<String, Image> addImage = (String key, Image img) =>
            {
                listViewResult.SmallImageList.Images.Add(key, img);
            };

            addImage(ElementUtils<ConfigObject>.GetName(), Properties.Resources.folder_icon);
            addImage(ElementUtils<ConfigCollection>.GetName(), Properties.Resources.icon_basket);
            addImage(ElementUtils<FieldString>.GetName(), Properties.Resources.icon_string);
            addImage(ElementUtils<FieldInt>.GetName(), Properties.Resources.icon_integer_2);
            addImage(ElementUtils<FieldNumeric>.GetName(), Properties.Resources.icon_numeric);
            addImage(ElementUtils<FieldBoolean>.GetName(), Properties.Resources.boolean_icon);

            // List View Settings
            listViewResult.MultiSelect = false;
            listViewResult.FullRowSelect = true;
            listViewResult.SelectedIndexChanged += new EventHandler(listViewResult_SelectedIndexChanged);

            // Add columns
            ColumnHeader nameHeader = new ColumnHeader();
            nameHeader.Text = "Name";
            nameHeader.Name = "colName";
            nameHeader.Width = listViewResult.Width / 2;
            listViewResult.Columns.Add(nameHeader);

            ColumnHeader valueHeader = new ColumnHeader();
            valueHeader.Text = "Value";
            valueHeader.Name = "colValue";
            valueHeader.Width = listViewResult.Width / 2;
            listViewResult.Columns.Add(valueHeader);
        }

        public void setTreeView(ConfigObjectTreeView treeView)
        {
            this.genericTree = treeView;

            // This makes sure we can still highlight the treeview when it's out of focus
            // e.g. when the SearchWindow is opened.
            treeView.HideSelection = false;
        }

        public void setMainWindow(Form mainForm)
        {
            this.mainForm = mainForm;
        }
        /// <summary>
        /// Returns a function that given a GenericNode, returns true if 
        /// the value of the Element contained in the GenericNode matches
        /// the query value. If the Element does not have a value field,
        /// then the function vacuously returns true.
        /// </summary>
        /// <returns></returns>
        private Func<GenericNode<Element>, Boolean> getValueMatcher()
        {
            String queryValue = textBoxValue.Text;

            switch (dropdownType.SelectedIndex)
            {
                case 0: // Any
                case 5: // ConfigObject
                case 6: // ConfigCollection
                    return (GenericNode<Element> a_node) =>
                    {
                        // We don't care about the value query since Objects and Collections have no value
                        return true;
                    };

                default: // Fields

                    // Should only be called on ConfigFields
                    // will throw an Exception if it is called on other types
                    return (GenericNode<Element> a_node) =>
                    {
                        return Utils.returnIfType<ConfigField, Boolean>(a_node.Data, (ConfigField field) =>
                        {
                            return field.Value.ToString().Contains(queryValue);

                        }, (Object obj) =>
                        {
                            throw new InvalidOperationException("Program should not reach here, there is a bug or logic error");
                        });
                    };
            }
        }

        /// <summary>
        /// Returns a function that given a GenericNode, returns true if 
        /// the type of the Element contained in the GenericNode matches
        /// the query type. If the user requested for any type, 
        /// then the function vacuously returns true.
        /// </summary>
        /// <returns></returns>
        private Func<GenericNode<Element>, Boolean> getTypeMatcher()
        {
            if (dropdownType.SelectedIndex == 0) // Any
            {
                return (GenericNode<Element> a_node) =>
                {
                    // We ignore the type
                    return true;
                };
            }

            Type queryType;
            switch (dropdownType.SelectedIndex)
            {
                case 1: // FieldString
                    queryType = typeof(FieldString);
                    break;

                case 2: // FieldBoolean
                    queryType = typeof(FieldBoolean);
                    break;

                case 3: // FieldInt
                    queryType = typeof(FieldInt);
                    break;

                case 4: // FieldNumeric
                    queryType = typeof(FieldNumeric);
                    break;

                case 5: // ConfigObject
                    queryType = typeof(ConfigObject);
                    break;

                case 6: // ConfigCollection
                    queryType = typeof(ConfigCollection);
                    break;

                case 7: // Any field
                    queryType = typeof(ConfigField);
                    break;

                case 0: // Any
                default:
                    throw new InvalidOperationException("Program should not reach here, there is a bug or logic error");
            }

            return (GenericNode<Element> a_node) =>
            {
                // This also returns true if a_node.Data is a subclass of 
                // queryType
                return queryType.IsAssignableFrom(a_node.Data.GetType());
            };
        }

        /// <summary>
        /// Returns a function that given a GenericNode, returns true if 
        /// the visibleText field of the Element contained in the GenericNode matches
        /// the query visibleText. If the Element does not have a visibleText field or
        /// if the user requested for "any" visibleText, then the function vacuously returns true.
        /// </summary>
        /// <returns></returns>
        private Func<GenericNode<Element>, Boolean> getVisibleTextMatcher()
        {
            // Type is FieldString and VisibleText is NOT "any"
            if ((dropdownType.SelectedIndex == 1)
                && (dropDownVisibleText.SelectedIndex != 0))
            {
                Boolean visibleText;
                Boolean.TryParse(dropDownVisibleText.SelectedItem.ToString(), out visibleText);

                return (GenericNode<Element> a_node) =>
                {
                    return Utils.returnIfType<FieldString, Boolean>(a_node.Data, (FieldString fieldStr) =>
                    {
                        return fieldStr.VisibleText == visibleText;
                    }, (Object obj) =>
                    {
                        throw new InvalidOperationException("Program should not reach here, there is a bug or logic error");
                    });
                };
            }
            else
            {
                return (GenericNode<Element> a_node) =>
                {
                    return true;
                };
            }
        }

        /// <summary>
        /// Given a list of GenericNode which match the criteria of the current search,
        /// update the GUI to show the result.
        /// </summary>
        /// <param name="result"></param>
        private void updateResult(List<GenericNode<Element>> result)
        {
            labelResult.Text = "Results: " + result.Count;

            listViewResult.Items.Clear();

            result.ForEach((GenericNode<Element> a_node) =>
            {
                // Grab a list of nodes that are on the path from a_node to the root
                List<GenericNode<Element>> path = a_node.getPath();
                // Remove the last two elements, one is the "(root)" node
                // and the other is a hidden node that is the parent of the "(root)"
                // node
                path.RemoveAt(path.Count - 1);
                path.RemoveAt(path.Count - 1);

                // Reverse so we get the ancestors first
                path.Reverse();

                // Grab the node names
                IEnumerable<String> nodeNames = path.Select(
                    (GenericNode<Element> pathNode) =>
                    {
                        return pathNode.Text;
                    });

                // Output the path as "." separated
                String pathStr = String.Join(".", nodeNames);
                String valueStr = Utils.returnIfType<ConfigField, String>(a_node.Data,
                    (ConfigField field) =>
                    {
                        return field.Value.ToString();
                    }, (Object obj) =>
                    {
                        return "";
                    });
                ListViewItem item = new ListViewItem(new String[] { pathStr, valueStr }, a_node.Data.Name);
                item.Tag = a_node;
                listViewResult.Items.Add(item);
            });
        }

        private void buttonSearch_Click(object sender, EventArgs e)
        {
            Func<GenericNode<Element>, Boolean> valueMatches = getValueMatcher();
            Func<GenericNode<Element>, Boolean> visibleTextMatches = getVisibleTextMatcher();
            Func<GenericNode<Element>, Boolean> typeMatches = getTypeMatcher();

            String queryName = textBoxName.Text;
            List<GenericNode<Element>> result = new List<GenericNode<Element>>();

            Action<GenericNode<Element>> searcher = (GenericNode<Element> a_node) =>
            {
                if (typeMatches(a_node) && a_node.Text.Contains(queryName) && valueMatches(a_node)
                    && visibleTextMatches(a_node))
                {
                    result.Add(a_node);
                }
            };

            switch (dropDownSearchMethod.SelectedIndex)
            {
                case 0: // preorder
                    genericTree.Root.preOrderTraversal(searcher);
                    break;

                case 1: // postorder
                    genericTree.Root.postOrderTraversal(searcher);
                    break;

                case 2: // breadth-first
                    genericTree.Root.breadthFirstTraversal(searcher);
                    break;

                case 3: // depth-first
                    genericTree.Root.depthFirstTraversal(searcher);
                    break;

                case 4: // alphabetical
                    genericTree.Root.depthFirstTraversal(searcher);
                    result.Sort(delegate(GenericNode<Element> n1, GenericNode<Element> n2)
                    {
                        return n1.Text.CompareTo(n2.Text);
                    });
                    break;
            }

            updateResult(result);
        }

        private void listViewResult_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (listViewResult.SelectedIndices.Count > 0)
            {
                genericTree.BeginUpdate();


                Utils.doIfType<GenericNode<Element>>(listViewResult.SelectedItems[0].Tag,
                    (GenericNode<Element> selectedNode) =>
                    {
                        TreeNodeAdv expandNode;

                        // Figure out which node to expand (child or parent)
                        // If the stored Data is a ConfigField, then it is a leaf of the tree
                        // so we must expand the parent node.  
                        if (selectedNode.Data is ConfigField)
                        {
                            // Parent will never be null unless it has been removed from the tree
                            // All ConfigFields will have a parent (at the very least "root" which
                            // cannot be deleted)
                            if (selectedNode.Parent == null) { expandNode = null; }
                            else { expandNode = genericTree.getTreeNodeAdv(selectedNode.Parent); }
                        }
                        else
                        {
                            expandNode = genericTree.getTreeNodeAdv(selectedNode);
                        }

                        if (expandNode == null) {
                            MessageBox.Show("The node has been deleted, perform another search to update the results");
                            return;
                        }
                        TreeNodeAdv selectNode = genericTree.setSelectedNode(selectedNode);
                        if (selectNode == null)
                        {
                            MessageBox.Show("The node has been deleted, perform another search to update the results");
                            return;
                        }
                        
                        expandNode.ExpandAll();
                        genericTree.EnsureVisible(selectNode);                        
                    },
                    (Object others) =>
                    {
                        throw new InvalidOperationException("Runtime error, cannot cast selected item to a GenericNode");
                    });

                genericTree.EndUpdate();
            }
        }

        private void dropdownType_SelectedIndexChanged(object sender, EventArgs e)
        {
            Boolean configFieldSelected;

            switch (dropdownType.SelectedIndex)
            {
                case 0: // Any
                case 5: // ConfigObject
                case 6: // ConfigCollection
                    configFieldSelected = false;
                    break;

                default:
                    configFieldSelected = true;
                    break;
            }

            // Disable value search options for all except
            // config fields
            labelValue.Enabled = configFieldSelected;
            textBoxValue.Enabled = configFieldSelected;

            // Disable visible text search options for all except
            // config strings
            Boolean configStringSelected = (dropdownType.SelectedIndex == 1);
            labelVisibleText.Enabled = configStringSelected;
            dropDownVisibleText.Enabled = configStringSelected;
        }
    }
}
