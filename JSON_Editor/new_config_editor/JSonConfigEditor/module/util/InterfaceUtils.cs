using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JSonConfigEditor.util
{
    public interface IDeepCloneable<T>
    {
        T deepClone();
    }
}
