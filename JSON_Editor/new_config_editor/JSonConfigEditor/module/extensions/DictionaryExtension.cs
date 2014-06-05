using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JSonConfigEditor.extensions
{
    public static class DictionaryExtension
    {
        /**
         * Calls the given action on each key-value pair in the given dictionary. 
         */
        public static void forEach<TKey, TValue>(
            this Dictionary<TKey, TValue> dict, Action<TKey, TValue> action)
        {
            foreach (TKey key in dict.Keys)
            {
                action(key, dict[key]);
            }
        }

        /**
         * Given a dictionary containing keys of type TKey and values of type TValueIn,
         * returns a dictionary containing keys of type TKey and values of type TValueOut,
         * where each value in the returned dictionary is the result of calling the given
         * functon on each key-value pair in the given dictionary. 
         */
        public static Dictionary<TKey, TValueOut> map<TKey, TValueIn, TValueOut>(
            this Dictionary<TKey, TValueIn> dict, Func<TKey, TValueIn, TValueOut> func)
        {
            Dictionary<TKey, TValueOut> outDict = new Dictionary<TKey, TValueOut>();
            foreach (TKey key in dict.Keys)
            {
                outDict.Add(key, func(key, dict[key]));
            }
            return outDict;
        }

        /**
         * Removes the first occurrence of the given value in the given dictionary. 
         */
        public static Boolean remove<TKey, TValue>(
            this Dictionary<TKey, TValue> dict, TValue value)
        {
            foreach (TKey key in dict.Keys)
            {
                if (dict[key].Equals(value))
                {
                    dict.Remove(key);
                    return true;
                }
            }
            return false;
        }

        /**
         * Adds the given key-value to the given dictionary. Returns true if the addition
         * was successful, returns false if the given key already exists in the given dictionary.
         */
        public static Boolean add<TKey, TValue>(
            this Dictionary<TKey, TValue> dict, TKey key, TValue value)
        {
            if (dict.ContainsKey(key))
            {
                return false;
            }
            dict.Add(key, value);
            return true;
        }
    }
}
