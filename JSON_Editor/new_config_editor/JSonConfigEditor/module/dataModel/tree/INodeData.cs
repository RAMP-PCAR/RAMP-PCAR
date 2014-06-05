using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.util;

namespace JSonConfigEditor.tree
{
    public interface INodeData<T> : IDeepCloneable<T> where T : INodeData<T>
    {
        GenericNode<T> Owner
        {
            get;
            set;
        }
    }
}
