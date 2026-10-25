package com.partkart
{
   public class Undo
   {
      
      public var scene:SceneGraph;
      
      public function Undo(s:SceneGraph)
      {
         super();
         this.scene = s;
      }
      
      public function undoAction() : void
      {
      }
      
      public function redoAction() : void
      {
      }
   }
}

