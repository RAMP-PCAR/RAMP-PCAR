using System;
using JSonConfigEditor.dataModel.configElement;
using JSonConfigEditor.tree;
using JSonConfigEditor.util;

namespace JSonConfigEditor.module.gui.editor.module.dataModel
{
    public class ConfigNode<T> : GenericNode<T> where T : Element, IDeepCloneable<T>, INodeData<T>
    {
        public void add(GenericNode<T> parent, String name, T value)
        {

        }
    }
}
