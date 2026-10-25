package com.partkart
{
   import flash.geom.Point;
   
   public class UndoPointMove extends Undo
   {
      
      public var point:Point;
      
      public var undopoint:Point;
      
      public var redopoint:Point;
      
      public var path:Path;
      
      public function UndoPointMove(s:SceneGraph)
      {
         super(s);
      }
      
      override public function undoAction() : void
      {
         this.point.x = this.undopoint.x;
         this.point.y = this.undopoint.y;
         this.path.dirty = true;
         this.path.camdirty = true;
      }
      
      override public function redoAction() : void
      {
         this.point.x = this.redopoint.x;
         this.point.y = this.redopoint.y;
      }
   }
}

