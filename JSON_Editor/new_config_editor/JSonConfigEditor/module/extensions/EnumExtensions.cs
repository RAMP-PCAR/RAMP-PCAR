using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JSonConfigEditor.extensions
{
    public static class EnumExtensions
    {
        public static T ToEnum<T>(this String enumString)
        {
            return (T)Enum.Parse(typeof(T), enumString);
        }

        public static String GetString(this Enum enumObj)
        {
            return Enum.GetName(enumObj.GetType(), enumObj);
        }    
    }
}
