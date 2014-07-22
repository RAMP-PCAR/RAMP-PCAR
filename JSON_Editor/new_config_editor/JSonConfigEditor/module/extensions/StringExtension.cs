using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JSonConfigEditor.extensions
{
    public static class StringExtension
    {
        /// <summary>
        /// Truncate the given String to maxLength by dropping characters from the
        /// back of the String.
        ///
        /// </summary>
        /// <param name="value"></param>
        /// <param name="maxLength"></param>
        /// <param name="appendEllipsis">true if ellipsis should be appended to the String when
        /// it has been truncated</param>
        /// <returns></returns>
        public static string Truncate(this string value, int maxLength, bool appendEllipsis)
        {
            if (string.IsNullOrEmpty(value) || value.Length <= maxLength) return value;

            String newStr = value.Substring(0, maxLength);
            if (appendEllipsis)
            {
                newStr += "...";
            }
            return newStr;
        }

        /// <summary>
        /// Truncate the given String to maxLength by dropping characters starting from
        /// the front of the String.
        ///
        /// </summary>
        /// <param name="value"></param>
        /// <param name="maxLength"></param>
        /// <param name="appendEllipsis">true if ellipsis should be prepended to the String when
        /// it has been truncated</param>
        /// <returns></returns>
        public static string TruncateFromFront(this string value, int maxLength, bool appendEllipsis)
        {
            if (string.IsNullOrEmpty(value) || value.Length <= maxLength) return value;

            String newStr = value.Substring(value.Length - maxLength, maxLength);
            if (appendEllipsis)
            {
                newStr = "..." + newStr;
            }
            return newStr;
        }
    }
}