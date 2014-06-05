using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using Aga.Controls.Tree;
using Aga.Controls.Tree.NodeControls;
using JSonConfigEditor.extensions;
using JSonConfigEditor.tree;
using JSonConfigEditor.util;
using Newtonsoft.Json.Linq;
using JSonConfigEditor.dataModel.configElement;

namespace JSonConfigEditor.dataModel
{
    /// <summary>
    /// Specialization of GenericTreeView that deals specifically with 
    /// ConfigElement and its subclasses (i.e. ConfigObject, ConfigField and ConfigCollection).
    /// </summary>
    public class ConfigObjectTreeView : GenericTreeView<Element>
    {
        public ConfigObjectTreeView()
        {
            DragOver += new DragEventHandler(ConfigObjectTreeView_DragOver);
            // Add all the types as key and the image associated with each type to this TreeView's
            // ImageList

            //icon.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right)));
        }

        public void ConfigObjectTreeView_DragOver(object sender, DragEventArgs e)
        {
            if (getNode(DropPosition.Node).Data is ConfigField)
            {
                e.Effect = DragDropEffects.None;
            }
        }

        #region Override parent methods
        protected override Action getAddAction(GenericNode<Element> parent, GenericNode<Element> child, int index)
        {

            Action action = base.getAddAction(parent, child, index);
            return () =>
            {
                action();

                Element newObj = child.Data as Element;

                // TODO: update to work with new TreeViewAdv
                //child.SelectedImageKey = newObj.Type;
                //child.ImageKey = newObj.Type;

                // Checking type is normally not needed with method overloading
                // however C# does not allow method overloading for overriden
                // classes (the behaviour is unexpected, unlike Java)
                Utils.doIfType(child.Data,
                    (ConfigField configField) =>
                    {
                        // TODO: update to work with TreeViewAdv
                        //child.SelectedImageKey = configField.getValueType();
                        //child.ImageKey = configField.getValueType();
                    }, null);
            };
        }
        #endregion

        /// <summary>
        /// Set all the value of all the ConfigField in the subtree rooted
        /// at the given node to their default values.
        /// </summary>
        /// <param name="node"></param>
        public void clearValue(GenericNode<Element> node)
        {
            node.preOrderTraversal((GenericNode<Element> a_node) =>
            {
                Utils.doIfType(a_node.Data,
                    (ConfigField field) =>
                    {
                        field.setDefault();
                    }, null);
            });
        }

        public Boolean addJson(GenericNode<Element> parent, String json)
        {
            JToken token = JsonUtil.deserialize(json);
            if (token == null)
            {
                return false;
            }
            ConfigObjectTreeView tree = new ConfigObjectTreeView();
            tree.loadFromJson(token);
            tree.Root.ForEachChild((GenericNode<Element> a_node) =>
            {
                add(parent, deepClone(a_node));
            });
            return true;
        }

        #region Json Conversion
        // ======================== JSON CONVERSION ========================

        /**
         * Returns an object representing the content of this GenericTreeView which
         * can be serialized into a Json string.
         */
        public Object getSerializableValueObject()
        {
            return this.Root.Data.getSerializableValue();
        }

        /**
         * Returns an object representing the content of this GenericTreeView which
         * can be serialized into a Json string.
         */
        public Object getSerializableTemplateObject()
        {
            return this.Root.Data.getSerializableTemplate();
        }

        public void loadFromTemplate(JToken templateObj)
        {
            Action<JToken, GenericNode<Element>> loadHelper = null;
            loadHelper = (JToken templateToken, GenericNode<Element> parent) =>
            {
                String description, name, type;
                description = (string)templateToken["description"];
                name = (string)templateToken["name"];
                type = templateToken["type"].ToString();

                Element element;

                if (type.Equals(ElementUtils<ConfigObject>.GetName()))
                {
                    element = new ConfigObject();
                }
                else if (type.Equals(ElementUtils<ConfigCollection>.GetName()))
                {
                    element = new ConfigCollection();
                }
                else
                {                    
                    element =  ConfigField.getField(templateToken["value"].ToString(),
                            type);
                    
                    Utils.doIfType<FieldString>(element, (FieldString fieldStr) =>
                    {
                        Boolean visibleText = false;
                        if (templateToken["visibleText"] != null)
                        {
                            Boolean.TryParse(templateToken["visibleText"].ToString(), out visibleText);
                            fieldStr.VisibleText = visibleText;
                        }                        
                    }, null);
                }
                GenericNode<Element> newNode = this.add(parent, name, element);
                element.Description = description;

                // Recursively call loadHelper on each child, if there are any
                JToken children = templateToken["fields"];
                if (children != null)
                {
                    foreach (JToken child in children)
                    {
                        loadHelper(child, newNode);
                    }
                }
            };

            // Removes all node from the tree
            this.Root.Children.Clear();

            // Instead of calling loadHelper directly on templateObj, we need
            // to call it on each of its children, this way, we don't add an
            // extra "root" node.
            templateObj["fields"].ForEach((JToken child) =>
            {
                loadHelper(child, this.Root);
            });
            // Clears the redo/undo stack so the user cannot undo
            // operations performed during load
            this.ActionManager.clearStack();
        }

        public void loadFromJson(JToken jsonToken)
        {
            Action<JToken, String, GenericNode<Element>> loadHelper = null;

            loadHelper = (JToken jToken, String name, GenericNode<Element> parent) =>
            {
                switch (jToken.Type)
                {
                    case JTokenType.Property:
                        JProperty jProperty = (JProperty)jToken;
                        JToken value = jProperty.Value;
                        loadHelper(value, jProperty.Name, parent);
                        break;

                    case JTokenType.Object:
                        JObject jObject = (JObject)jToken;
                        GenericNode<Element> newObj = this.add(parent, name, new ConfigObject());
                        jObject.ForEach((KeyValuePair<String, JToken> pair) =>
                        {
                            loadHelper(pair.Value, pair.Key, newObj);
                        });
                        break;

                    case JTokenType.Array:
                        JArray jArray = (JArray)jToken;
                        GenericNode<Element> newCollection = this.add(parent, name, new ConfigCollection());
                        int i = 0;
                        jArray.ForEach((JToken child) =>
                        {
                            loadHelper(child, i.ToString(), newCollection);
                            i++;
                        });
                        break;

                    default:
                        this.add(parent, name, ConfigField.getFieldFromInput(jToken.ToString()));
                        break;
                }
            };

            // Removes all node from the tree
            this.Root.Children.Clear();

            // Need to do this so Root doesn't get added twice
            jsonToken.ForEach((JToken child) =>
            {
                loadHelper(child, null, this.Root);
            });

            // Clears the redo/undo stack so the user cannot undo
            // operations performed during load
            this.ActionManager.clearStack();
        }
        #endregion

        protected override void initRoot()
        {
            ConfigObject obj = new ConfigObject();
            obj.Description = "root";
            Root.Data = obj;
        }

        protected override NodeIcon getNodeIcon()
        {
            return new ElementIcon();
        }

        private class ElementIcon : NodeIcon
        {
            private readonly Image OBJECT, COLLECTION, BOOL, INT, NUM, STR;
            private readonly int ICON_WIDTH = 25;
            private readonly int ICON_HEIGHT = 25;

            private Bitmap scale(Bitmap bitmap)
            {
                bitmap = bitmap.resize(ICON_WIDTH, ICON_HEIGHT);
                bitmap.MakeTransparent(bitmap.GetPixel(0, 0));
                return bitmap;
            }

            public ElementIcon()
            {
                OBJECT = scale(Properties.Resources.folder_icon);
                COLLECTION = scale(Properties.Resources.icon_basket);
                BOOL = scale(Properties.Resources.boolean_icon);
                INT = scale(Properties.Resources.icon_integer_2);
                NUM = scale(Properties.Resources.icon_numeric);
                STR = scale(Properties.Resources.icon_string);
            }

            protected override Image GetIcon(TreeNodeAdv node)
            {
                GenericNode<Element> genericNode = node.Tag as GenericNode<Element>;
                if (genericNode.Image == null)
                {
                    Element element = genericNode.Data;

                    genericNode.Image = Utils.returnIfType(element,
                        (ConfigField field) =>
                        {
                            return Utils.returnIfType(field,
                            (FieldInt arg) => INT,
                            (FieldBoolean arg) => BOOL,
                            (FieldNumeric arg) => NUM,
                            (FieldString arg) => STR,
                            (Object arg) => STR);
                        },
                        (ConfigCollection arg) => COLLECTION,
                        (ConfigObject arg) => OBJECT,
                        (Object arg) => OBJECT);
                }

                return genericNode.Image;
            }
        }
    }


}
