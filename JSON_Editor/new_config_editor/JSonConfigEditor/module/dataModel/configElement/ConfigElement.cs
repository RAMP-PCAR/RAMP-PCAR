using System;
using System.Linq;
using JSonConfigEditor.extensions;
using JSonConfigEditor.module;
using JSonConfigEditor.tree;

namespace JSonConfigEditor.dataModel.configElement
{    
    /// <summary>
    /// A class containing static methods that allow the user to access 
    /// instance methods of Element Objects without needing to instantiate one,
    /// as long as the name of a concrete class is provided.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public static class ElementUtils<T> where T : Element, new()
    {
        private static readonly InstanceCache<T> cache = new InstanceCache<T>();

        /// <summary>
        /// Returns true if the given name represents type T.
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        public static Boolean IsType(String name)
        {
            return GetName().Equals(name);
        }

        /// <summary>
        /// Returns the Name of type T.
        /// </summary>
        /// <returns></returns>
        public static String GetName()
        {
            return cache.GetCachedInstance().Name;
        }
    }

    /**
     * The super class of all objects that represent an element in 
     * the configuration JSon file. 
     */
    [Serializable]
    public abstract class Element : INodeData<Element>
    {
        public const String DEFAULT_DESCRIPTION = "";

        protected Element()
        {
            this.Description = DEFAULT_DESCRIPTION;
        }

        #region Properties
        #region Metadata Properties
        public String Description
        {
            get;
            set;
        }
        #endregion

        private GenericNode<Element> _owner;

        /// <summary>
        /// The GenericNode holding this Element if this Element has been added to 
        /// a tree, null otherwise.
        /// </summary>
        public GenericNode<Element> Owner
        {
            get { return _owner; }
            set { _owner = value; }
        }
        #endregion

        #region Abstract methods
        /// <summary>
        /// Return an anonymous object that can be serialized into Json to
        /// represent the essential information of this Element. If one were 
        /// to serialize this entire object, it may include information
        /// that takes up unnecessary storage space, such as private properties
        /// and functions.
        /// </summary>
        /// <returns></returns>
        public abstract Object getSerializableValue();

        /// <summary>
        /// Return an anonymous object that can be serialized into Json to
        /// represent the essential information of this Element as well as
        /// any metadata information (such as Description).
        /// </summary>
        /// <returns></returns>
        public abstract Object getSerializableTemplate();

        //public abstract void initFromJson(JToken token);

        //public abstract void initFromTemplate(JToken token);

        /// <summary>
        /// Returns a String representation of this class that can be used for
        /// serialization, displaying options in the menu, etc.
        /// </summary>
        /// <returns></returns>
        public abstract String Name
        {
            get;
        }
        #endregion

        #region Static methods

        public static Element GetElement(String type)
        {
            if (ElementUtils<ConfigCollection>.IsType(type))
            {
                return new ConfigCollection();
            }
            else if (ElementUtils<ConfigObject>.IsType(type))
            {
                return new ConfigObject();
            }
            else 
            {
                return ConfigField.GetField(type);
            }
        }
        #endregion
        
        public abstract Element deepClone();
    }

    /**
     * Represents a custom JSon Array. A collection can hold multiple objects, but these objects
     * should have identical fields, collections, objects (even if the value of these fields,
     * collections, and objects are different).
     */
    [Serializable]
    public class ConfigCollection : Element
    {
        public ConfigCollection() { }

        #region Overidden Methods
        // Would declare return type as "ConfigCollection" instead of "ConfigElement"
        // but C# does not support covariant return types :(
        public override Element deepClone()
        {
            Element clone = new ConfigCollection();
            clone.Description = this.Description;
            return clone;
        }

        public override Object getSerializableValue()
        {
            // This will be serialized as an array of objects, i.e.:
            // [{...}, {...}, ...]
            return this.Owner.GetChildren().Select<GenericNode<Element>, Object>(
                (GenericNode<Element> a_node) =>
                {
                    return a_node.Data.getSerializableValue();
                });
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
            get { return "Collection"; }
        }
        #endregion        
    }
}
