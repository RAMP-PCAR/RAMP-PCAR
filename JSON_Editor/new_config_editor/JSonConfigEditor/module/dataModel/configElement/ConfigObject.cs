using System;
using System.Collections.Generic;
using JSonConfigEditor.extensions;
using JSonConfigEditor.tree;

namespace JSonConfigEditor.dataModel.configElement
{
    /**
     * Represents a custom JSon Object in the configuration file. JSon Objects can have
     * nested fields, collection, or other objects.
     */
    [Serializable]
    public class ConfigObject : Element
    {
        public ConfigObject() { }

        #region Overriden methods
        public override Element deepClone()
        {
            ConfigObject clone = new ConfigObject();
            clone.Description = this.Description;
            return clone;
        }

        public override Object getSerializableValue()
        {
            /* 
             * A dictionary will be serialized to an object with the key-value
             * pairs as properties. For example if a dictionary contains:
             * ("key1", "value1"), ("key2", "value2") 
             * Then the dictionary will be serialized to this string:
             * {"key1":"value1","key2":"value2"}
             */
            Dictionary<String, Object> dict = new Dictionary<string, Object>();

            this.Owner.ForEachChild((GenericNode<Element> child) =>
            {
                /*
                 * The text displayed on the GenericNode<Element> is the key.
                 * The value is whatever object is represented by the child
                 * which could just be a field or another object with nested
                 * fields and objects
                 */
                dict.Add(child.Text, child.Data.getSerializableValue());
            });

            return dict;
        }

        public override Object getSerializableTemplate()
        {
            return new
            {
                name = Owner.Text,
                type = Name,
                description = Description,
                // Fields contain an array of objects where each object is 
                // the return value of a recursive call to getSerializableTemplateObject
                // on a child node.
                fields = Owner.ForEachChild((GenericNode<Element> a_node) =>
                    a_node.Data.getSerializableTemplate())
            };
        }

        public override string Name
        {
            get { return "Object"; }
        }
        #endregion

    }
}
