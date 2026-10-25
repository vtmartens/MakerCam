package com.partkart
{
   import com.greenthreads.*;
   
   public class ProcessFile extends GreenThread
   {
      
      private var pathlist:Array;
      
      private var separated:Boolean = false;
      
      private var current:int = 0;
      
      private var scene:SceneGraph;
      
      private var len:int;
      
      public var svgxml:XML;
      
      public function ProcessFile(inputscene:SceneGraph, inputpaths:Array, inputsvgxml:XML)
      {
         super();
         this.scene = inputscene;
         this.pathlist = inputpaths;
         this.svgxml = inputsvgxml;
      }
      
      override protected function initialize() : void
      {
         var path:Path = null;
         _progress = 0;
         _maximum = 0;
         for each(path in this.pathlist)
         {
            if(path.active == true)
            {
               _maximum += 2;
            }
         }
         this.len = this.pathlist.length;
      }
      
      override protected function run() : Boolean
      {
         var paths:Array = null;
         var p:Path = null;
         var path:Path = null;
         var j:int = 0;
         var path2:Path = null;
         if(!this.separated)
         {
            if(this.current == this.len)
            {
               this.current = 0;
               this.separated = true;
               return true;
            }
            if(this.pathlist[this.current].active == true)
            {
               paths = this.pathlist[this.current].separate();
               if(paths.length > 0)
               {
                  for each(p in paths)
                  {
                     p.name = this.pathlist[this.current].name;
                     p.active = true;
                  }
                  _maximum += paths.length - 1;
                  this.pathlist.splice(this.current,1);
                  this.scene.addPaths(paths);
                  --this.current;
                  --this.len;
               }
               ++_progress;
            }
         }
         else
         {
            if(this.current == this.pathlist.length)
            {
               return false;
            }
            path = this.pathlist[this.current];
            if(path.active == true)
            {
               ++_progress;
               path.cleanup(0.0001,true);
               path.resetSegments();
               for(j = this.current + 1; j < this.pathlist.length; j++)
               {
                  path2 = this.pathlist[j];
                  if(path != path2 && path.active == true && path2.active == true)
                  {
                     if(Global.withinTolerance(path.seglist[0].p1,path2.seglist[0].p1,0.1))
                     {
                        path.reversePath();
                        path.resetSegments();
                        path.mergePath(path2,path.seglist[path.seglist.length - 1].p2,false);
                        j = this.current;
                     }
                     else
                     {
                        if(Global.withinTolerance(path.seglist[0].p1,path2.seglist[path2.seglist.length - 1].p2,0.1))
                        {
                           path2.mergePath(path,path2.seglist[path2.seglist.length - 1].p2,false);
                           --this.current;
                           break;
                        }
                        if(Global.withinTolerance(path.seglist[path.seglist.length - 1].p2,path2.seglist[0].p1,0.1))
                        {
                           path.mergePath(path2,path.seglist[path.seglist.length - 1].p2,false);
                           j = this.current;
                        }
                        else if(Global.withinTolerance(path.seglist[path.seglist.length - 1].p2,path2.seglist[path2.seglist.length - 1].p2,0.1))
                        {
                           path2.reversePath();
                           path.mergePath(path2,path.seglist[path.seglist.length - 1].p2,false);
                           j = this.current;
                        }
                     }
                  }
               }
            }
         }
         ++this.current;
         return true;
      }
   }
}

