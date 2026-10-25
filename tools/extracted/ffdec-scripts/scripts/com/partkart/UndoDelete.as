package com.partkart
{
   public class UndoDelete extends Undo
   {
      
      public var pathlist:Array;
      
      public var cutlist:Array;
      
      public var cutparent:Array;
      
      public function UndoDelete(s:SceneGraph)
      {
         super(s);
      }
      
      override public function undoAction() : void
      {
         var path:Path = null;
         var cut:CutObject = null;
         var obj:Object = null;
         for each(path in this.pathlist)
         {
            scene.addPath(path);
            path.dirty = true;
            path.camdirty = true;
         }
         for each(cut in this.cutlist)
         {
            scene.addCut(cut);
         }
         for each(obj in this.cutparent)
         {
            if(obj.cut.pathlist.indexOf(obj.path) == -1)
            {
               obj.cut.pathlist.push(obj.path);
            }
         }
      }
      
      override public function redoAction() : void
      {
         var path:Path = null;
         var cut:CutObject = null;
         var obj:Object = null;
         var index:int = 0;
         for each(path in this.pathlist)
         {
            scene.removePath(path);
         }
         for each(cut in this.cutlist)
         {
            scene.removeCut(cut);
         }
         for each(obj in this.cutparent)
         {
            index = int(obj.cut.pathlist.indexOf(obj.path));
            if(index != -1)
            {
               obj.cut.pathlist.splice(index,1);
            }
         }
      }
   }
}

