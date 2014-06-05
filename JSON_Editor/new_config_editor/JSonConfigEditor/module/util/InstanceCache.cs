using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JSonConfigEditor.module
{
    public class InstanceCache<T> where T : new()
    {
        /// <summary>
        /// Cache the Instance object created for a Type so it does not 
        /// need to be recreated in the future. 
        /// </summary>
        private Dictionary<Type, T> cache = new Dictionary<Type, T>();

        /// <summary>
        /// Returns an Instance of type T. This method will first check
        /// the cache to see if an instance has already been generated, in which case
        /// the cached instance is returned.
        /// </summary>
        /// <returns></returns>
        public T GetCachedInstance()
        {
            Type type = typeof(T);
            if (!cache.ContainsKey(type))
            {
                cache[type] = CreateInstance();
            }
            return cache[type];
        }

        /// <summary>
        /// Returns a new instance of type T (by calling its no-argument
        /// constructor)
        /// </summary>
        /// <returns></returns>
        public T CreateInstance()
        {
            return new T();
        }
    }
}
