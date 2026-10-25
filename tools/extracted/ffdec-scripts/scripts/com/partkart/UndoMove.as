package com.partkart
{
   public class UndoMove extends Undo
   {
      
      public var pathlist:Array;
      
      public var xdelta:Number;
      
      public var ydelta:Number;
      
      public function UndoMove(s:SceneGraph)
      {
         super(s);
      }
      
      override public function undoAction() : void
      {
         var path:* = undefined;
         for each(path in this.pathlist)
         {
            path.docx -= this.xdelta;
            path.docy -= this.ydelta;
            if(path is Path)
            {
               path.dirty = true;
               path.camdirty = true;
            }
         }
      }
      
      override public function redoAction() : void
      {
         var path:* = undefined;
         for each(path in this.pathlist)
         {
            path.docx += this.xdelta;
            path.docy += this.ydelta;
         }
      }
   }
}

