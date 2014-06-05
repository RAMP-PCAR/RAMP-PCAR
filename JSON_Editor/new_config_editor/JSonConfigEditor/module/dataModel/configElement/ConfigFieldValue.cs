using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using JSonConfigEditor.tree;
using JSonConfigEditor.util;
using JSonConfigEditor.module;

namespace JSonConfigEditor.dataModel.configElement
{
    /// <summary>
    /// Since static methods cannot be inherited in C#, this class is a 
    /// workaround that includes static methods which uses instance methods
    /// that subclasses were forced to implement from the superclass. 
    /// For example, in the case of ConfigFields, each ConfigField subclass should
    /// should define a convert method, which given a String returns an object 
    /// if it can convert the String and null if it cannot. However, since there is 
    /// no static inheritance in C#, we are forced to define abstract instance methods
    /// (instead of abstract static methods). This class can then create an instance 
    /// of that subclass and call the instance's convert method and check whether 
    /// the return value is null. This way this class can define a static method 
    /// "canConvert" that indicate when a subclass can convert a String.
    /// </summary>
    /// <typeparam name="T"></typeparam>
    public static class ConfigFieldUtils<T> where T : ConfigField, new()
    {
        /// <summary>
        /// Cache the Instance object created for a Type so it does not 
        /// need to be recreated in the future. 
        /// </summary>
        private static readonly InstanceCache<T> _cache = new InstanceCache<T>();

        /// <summary>
        /// Returns a new instance of type T (by calling its no-argument
        /// constructor)
        /// </summary>
        /// <returns></returns>
        public static T CreateInstance()
        {
            return new T();
        }

        /// <summary>
        /// Returns true if type T can convert the given input.
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        public static Boolean CanConvert(String input)
        {
            return _cache.GetCachedInstance().convert(input) != null;
        }
    }

    /// <summary>
    /// A class to represent primative values (e.g. integers, booleans, strings) 
    /// in the Config Json File. 
    /// </summary>
    [Serializable]
    public abstract class ConfigField : Element
    {
        /// <summary>
        /// An array of the names of all the ConfigFields.
        /// </summary>
        public static readonly String[] NAMES = new String[] {
                ElementUtils<FieldString>.GetName(),
                ElementUtils<FieldBoolean>.GetName(),
                ElementUtils<FieldInt>.GetName(),
                ElementUtils<FieldNumeric>.GetName()
            };

        #region Properties
        private Object _value;
        /// <summary>
        /// Returns the value of this ConfigField (e.g. an integer 123, a boolean true, 
        /// a String "abc", etc.). The set method will throw an Argument exception if
        /// the given value cannot be stored in this ConfigField.
        /// </summary>
        public Object Value
        {
            get
            {
                return _value;
            }
            set
            {
                Object converted = convert(value.ToString());
                if (converted == null)
                {
                    throw new ArgumentException("The given value does not match the type!");
                }
                this._value = converted;
            }
        }
        #endregion

        /// <summary>
        /// Instantiates a ConfigField with the given ElementType, the 
        /// Value is set to the default value.
        /// </summary>
        /// <param name="valueType"></param>
        protected ConfigField()
        {
            setDefault();
        }

        /// <summary>
        /// Instantiates a ConfigField with the given ElementType and Value.
        /// Throws an ArgumentException if the given Value does not match
        /// the ElementType  (e.g. if the ElementType was Integer and the
        /// given value was "abc").
        /// </summary>
        /// <param name="value"></param>
        /// <param name="valueType"></param>
        protected ConfigField(Object value)
        {
            this.Value = value;
        }

        public void setDefault()
        {
            this._value = DefaultValue;
        }

        #region Overriden Methods
        public override Object getSerializableValue()
        {
            return this.Value;
        }

        public override object getSerializableTemplate()
        {
            Dictionary<String, Object> dict = new Dictionary<string, Object>();
            dict.Add("name", Owner.Text);
            dict.Add("type", Name);
            dict.Add("value", Value);
            dict.Add("description", Description);

            return dict;
        }

        #endregion

        #region Static methods
        /// <summary>
        /// Given a String, figure out the best matching ConfigField for that 
        /// String.
        /// Example:
        /// If the given String is: "123", then the best matching ConfigField could
        /// be FieldInt. 
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        public static ConfigField getFieldFromInput(String input)
        {
            /*
            if (Regex.Match(input, "\".*\"", RegexOptions.IgnoreCase).Success)
            {
                // If it is quoted, then it's a String
                return new FieldValueString(input);
            }*/

            if (ConfigFieldUtils<FieldBoolean>.CanConvert(input))
            {
                return new FieldBoolean(input);

            }
            else if (ConfigFieldUtils<FieldInt>.CanConvert(input))
            {
                return new FieldInt(input);

            }
            else if (ConfigFieldUtils<FieldNumeric>.CanConvert(input))
            {
                return new FieldNumeric(input);
            }

            return new FieldString(input);
        }

        /// <summary>
        /// Returns a ConfigField given its ElementType. The value assigned to 
        /// the returned ConfigField will be its default value.
        /// </summary>
        /// <param name="type"></param>
        /// <returns></returns>
        public static ConfigField GetField(String type)
        {
            if (ElementUtils<FieldInt>.IsType(type))
            {
                return new FieldInt();
            }
            else if (ElementUtils<FieldNumeric>.IsType(type))
            {
                return new FieldNumeric();
            }
            else if (ElementUtils<FieldBoolean>.IsType(type))
            {
                return new FieldBoolean();
            }
            else
            {
                return new FieldString();
            }
        }

        /// <summary>
        /// Returns a ConfigField given a String and an ElementType. Throws 
        /// an ArgumentException if the given String is not compatible with the
        /// given ElementType.
        /// </summary>
        /// <param name="input"></param>
        /// <param name="type"></param>
        /// <returns></returns>
        public static ConfigField getField(String input, String type)
        {
            ConfigField field = GetField(type);
            field.Value = input;
            return field;
        }
        #endregion

        #region Abstract methods (to emulate static inheritance)
        /// <summary>
        /// Parse the given String input into an appropriate Object. E.g. parsing
        /// "123" into an integer.
        /// </summary>
        /// <param name="input"></param>
        /// <returns></returns>
        internal abstract Object convert(String input);

        /// <summary>
        /// Returns the default value for this FieldValue. E.g. the default value
        /// for Integers could be 0.
        /// </summary>
        /// <returns></returns>
        internal abstract Object DefaultValue
        {
            get;
        }
        #endregion
    }

    [Serializable]
    public class FieldBoolean : ConfigField
    {
        public FieldBoolean() { }

        public FieldBoolean(Object input) : base(input) { }

        #region Overriden Methods
        public override Element deepClone()
        {
            FieldBoolean clone = new FieldBoolean(this.Value);
            clone.Description = this.Description;
            return clone;
        }

        internal override object convert(String input)
        {
            Boolean temp;
            if (!bool.TryParse(input, out temp))
            {
                return null;
            }
            return temp;
        }

        public override string Name
        {
            get { return "Boolean"; }
        }

        internal override object DefaultValue
        {
            get { return false; }
        }
        #endregion
    }

    [Serializable]
    public class FieldNumeric : ConfigField
    {
        public FieldNumeric() { }

        public FieldNumeric(Object input) : base(input) { }

        #region Overidden Methods
        internal override object convert(String input)
        {
            float temp;
            if (!float.TryParse(input, out temp))
            {
                return null;
            }
            return temp;
        }

        public override Element deepClone()
        {
            FieldNumeric clone = new FieldNumeric(this.Value);
            clone.Description = this.Description;
            return clone;
        }

        internal override object DefaultValue
        {
            get { return 0f; }
        }

        public override string Name
        {
            get { return "Numeric"; }
        }
        #endregion
    }

    [Serializable]
    public class FieldInt : ConfigField
    {
        public FieldInt() { }

        public FieldInt(Object input) : base(input) { }

        #region Overidden Methods
        internal override object convert(String input)
        {
            int temp;
            if (!int.TryParse(input.ToString(), out temp))
            {
                return null;
            }
            return temp;
        }

        public override Element deepClone()
        {
            FieldInt clone = new FieldInt(this.Value);
            clone.Description = this.Description;
            return clone;
        }

        internal override object DefaultValue
        {
            get { return 0; }
        }

        public override string Name
        {
            get { return "Integer"; }
        }
        #endregion
    }

    [Serializable]
    public class FieldString : ConfigField
    {
        public Boolean VisibleText
        {
            get;
            set;
        }

        public FieldString()
        {
            VisibleText = false;
        }

        public FieldString(Object input)
            : base(input)
        {
            VisibleText = false;
        }

        #region Overidden Methods
        public override Element deepClone()
        {
            FieldString clone = new FieldString(this.Value);
            clone.Description = this.Description;
            return clone;
        }

        internal override Object convert(String input)
        {
            return input;
        }

        internal override object DefaultValue
        {
            get { return ""; }
        }

        public override string Name
        {
            get { return "String"; }
        }

        public override object getSerializableTemplate()
        {
            Dictionary<String, Object> dict = base.getSerializableTemplate() as Dictionary<String, Object>;
            dict.Add("visibleText", this.VisibleText);
            return dict;
        }

        #endregion
    }
}
