using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using Newtonsoft.Json.Linq;
using JSonConfigEditor.extensions;

namespace JSonConfigEditor.module
{

    /// <summary>
    /// GUI components can be added to the ComponentStatePreserver so their state
    /// can be saved and loaded from a file. 
    /// </summary>
    /// 
    /// <example>
    /// <code>
    /// ComponentStatePreserver preserver = new ComponentStatePreserver();
    /// 
    /// // Bind a bunch of components to the preserver
    /// // "abc" is the key, checkBox1 is a Windows Form Component
    /// // keys need to be unique
    /// preserver.bind("abc", checkBox1); 
    /// preserver.bind("hello", numericUpDown1);
    /// 
    /// // Save all properties of binded components to an anonymous object
    /// Object obj = preserver.save();
    /// 
    /// // Serialize the object into a String so it can be saved to a file
    /// String str = JsonConverter.SerializeObject(obj);
    /// 
    /// // ... Do something to save the String to a file ...
    /// // ... Do something to load the String from a file ...
    /// 
    /// // Deserialize the String into a JToken
    /// JToken deserialized = JSonConvert.DeserializeObject<JToken>(str);
    /// 
    /// // All components binded to the preserver will have their values set
    /// // to their values when perserver.save() was called.
    /// preserver.load(deserialized);
    /// </code>
    /// </example>
    public class ComponentStatePreserver
    {
        private readonly Dictionary<String, CheckBox> CHECKBOXES =
            new Dictionary<String, CheckBox>();

        private readonly Dictionary<String, NumericUpDown> NUMERIC_UPDOWN =
            new Dictionary<string, NumericUpDown>();

        public ComponentStatePreserver()
        {
        }

        /// <summary>
        /// Binds the given checkBox so its state can be saved and loaded.
        /// Returns true if the checkBox was successfully added. Returns false
        /// if the checkBox is already binded. 
        /// </summary>
        /// 
        /// <param name="key"></param>
        /// <param name="checkBox"></param>
        /// <returns></returns>
        public Boolean bind(String key, CheckBox checkBox)
        {
            return CHECKBOXES.add(key, checkBox);
        }

        public Boolean bind(String key, NumericUpDown upDown)
        {
            return NUMERIC_UPDOWN.add(key, upDown);
        }

        /// <summary>
        /// Unbind the given checkBox so its state can no longer be saved or
        /// loaded by this ComponentStatePreserver. Returns true if the checkBox
        /// was binded and has been successfully unbinded. Returns false if the
        /// checkBox was not binded in the first place. 
        /// </summary>
        /// <param name="checkBox"></param>
        /// <returns></returns>
        public Boolean unbind(CheckBox checkBox)
        {
            return CHECKBOXES.remove(checkBox);
        }

        public Boolean unbind(NumericUpDown upDown)
        {
            return NUMERIC_UPDOWN.remove(upDown);
        }

        /**
         * Initializes all the binded components from the properties contained
         * in the given JToken. The given JToken should be one that is deserialized from
         * the serialized the Object returned by save().
         */
        public void load(JToken jToken)
        {
            JToken checkBoxToken = jToken["checkboxes"];
            if (checkBoxToken != null)
            {
                CHECKBOXES.forEach((String key, CheckBox checkBox) =>
                {
                    Object obj = checkBoxToken[key];
                    if (obj != null)
                    {
                        Boolean result;
                        if (Boolean.TryParse(obj.ToString(), out result))
                        {
                            checkBox.Checked = result;
                        }
                    }

                });
            }

            JToken numericUpDownToken = jToken["numeric_updown"];
            if (numericUpDownToken != null)
            {
                NUMERIC_UPDOWN.forEach((String key, NumericUpDown upDown) =>
                {
                    Object obj = numericUpDownToken[key];
                    if (obj != null)
                    {
                        decimal result;
                        if (decimal.TryParse(obj.ToString(), out result))
                        {
                            upDown.Value = result;
                        }
                    }
                });
            }
        }

        /**
         * Returns a serializable Object that contains information about all 
         * binded components. The returned Object can be serialized into Json
         * using JsonConverter.Serialize, saved to a file, then later read from
         * the file, deserialized using JsonConverter.Deserialize<JToken>(), and
         * the deserialized JToken passed to load() to populate all binded 
         * components with their stored values.
         */
        public Object save()
        {
            return new
            {
                checkboxes = CHECKBOXES.map(
                (String key, CheckBox checkBox) => checkBox.Checked),

                numeric_updown = NUMERIC_UPDOWN.map(
                (String key, NumericUpDown upDown) => upDown.Value)
            };
        }
    }
}
