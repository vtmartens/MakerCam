package com.partkart
{
   import flash.geom.Point;
   import flash.geom.Rectangle;
   
   public class DrillCutObject extends CutObject
   {
      
      public var dlist:Array;
      
      public function DrillCutObject()
      {
         super();
      }
      
      override protected function run() : Boolean
      {
         var cutpath:CutPath = null;
         this.initializeDrill();
         this.redraw();
         return false;
      }
      
      public function initializeDrill() : void
      {
         var cutpath:CutPath = null;
         var drillpoint:Point = null;
         var rect:Rectangle = null;
         var bounds:Rectangle = null;
         var i:int = 0;
         var j:int = 0;
         this.dlist = new Array();
         if(center || spacing == 0)
         {
            for each(cutpath in cutlist)
            {
               rect = cutpath.getExactBounds();
               drillpoint = new Point(cutpath.docx + rect.x + rect.width / 2,-cutpath.docy + rect.y + rect.height / 2);
               this.dlist.push(drillpoint);
            }
         }
         else
         {
            for each(cutpath in cutlist)
            {
               bounds = cutpath.getExactBounds();
               for(i = 1; i < bounds.width / spacing; i++)
               {
                  for(j = 1; j < bounds.height / spacing; j++)
                  {
                     drillpoint = new Point(bounds.x + i * spacing,bounds.y + j * spacing);
                     if(cutpath.containsPoint(drillpoint))
                     {
                        this.dlist.push(new Point(drillpoint.x + cutpath.docx,drillpoint.y - cutpath.docy));
                     }
                  }
               }
            }
         }
      }
      
      override public function redraw() : void
      {
         var path:Path = null;
         var c:Number = NaN;
         var i:int = 0;
         this.graphics.clear();
         if(this.rootpath == null)
         {
            super.initialize();
            this.initializeDrill();
            processed = false;
         }
         for each(path in pathlist)
         {
            if(path.dirty == true || path.camdirty == true)
            {
               while(numChildren > 0)
               {
                  removeChildAt(0);
               }
               super.initialize();
               this.initializeDrill();
               processed = false;
               docx = 0;
               docy = 0;
               x = 0;
               y = 0;
               break;
            }
         }
         c = tooldiameter / 2.82842712;
         for(i = 0; i < this.dlist.length; i++)
         {
            if(processed == false)
            {
               graphics.lineStyle(0,0,0);
               if(active == false)
               {
                  graphics.beginFill(16776960,0.5);
               }
               else
               {
                  graphics.beginFill(56831,0.5);
               }
               graphics.drawCircle(this.dlist[i].x * Global.zoom,-this.dlist[i].y * Global.zoom,tooldiameter / 2 * Global.zoom);
               graphics.endFill();
            }
            else
            {
               graphics.beginFill(15658734,0.5);
               graphics.drawCircle(this.dlist[i].x * Global.zoom,-this.dlist[i].y * Global.zoom,tooldiameter / 2 * Global.zoom);
               graphics.endFill();
            }
            if(active == false || processed == false)
            {
               graphics.lineStyle(1,0,1);
            }
            else
            {
               graphics.lineStyle(2,0,1);
            }
            if(processed == true && Global.viewcuts == true)
            {
               graphics.lineStyle(0,0,0);
               graphics.beginFill(16711680,0.2);
               graphics.drawCircle(this.dlist[i].x * Global.zoom,-this.dlist[i].y * Global.zoom,tooldiameter / 2 * Global.zoom);
               graphics.endFill();
            }
            else
            {
               graphics.moveTo((this.dlist[i].x - c) * Global.zoom,(-this.dlist[i].y + c) * Global.zoom);
               graphics.lineTo((this.dlist[i].x + c) * Global.zoom,(-this.dlist[i].y - c) * Global.zoom);
               graphics.moveTo((this.dlist[i].x + c) * Global.zoom,(-this.dlist[i].y + c) * Global.zoom);
               graphics.lineTo((this.dlist[i].x - c) * Global.zoom,(-this.dlist[i].y - c) * Global.zoom);
            }
         }
         rootpath.visible = false;
      }
      
      override public function group() : Array
      {
         var cut:DrillCutObject = null;
         super.initialize();
         var groups:Array = super.group();
         var newcuts:Array = new Array();
         for(var i:int = 0; i < groups.length; i++)
         {
            cut = this.clone();
            cut.name = this.name + "-" + i;
            cut.pathlist = groups[i];
            newcuts.push(cut);
         }
         return newcuts;
      }
      
      protected function clone() : DrillCutObject
      {
         var newcut:DrillCutObject = new DrillCutObject();
         newcut.safetyheight = safetyheight;
         newcut.stocksurface = stocksurface;
         newcut.targetdepth = targetdepth;
         newcut.stepover = stepover;
         newcut.stepdown = stepdown;
         newcut.plungerate = plungerate;
         newcut.tooldiameter = tooldiameter;
         newcut.center = center;
         newcut.spacing = spacing;
         return newcut;
      }
      
      override public function setActive() : void
      {
         active = true;
         this.redraw();
      }
      
      override public function setInactive() : void
      {
         active = false;
         this.redraw();
      }
      
      public function drawNestBlank(color:uint = 0, gap:Number = 0) : void
      {
         this.graphics.clear();
         for(var i:int = 0; i < this.dlist.length; i++)
         {
            graphics.beginFill(color,1);
            graphics.drawCircle(this.dlist[i].x * Global.zoom,-this.dlist[i].y * Global.zoom,(tooldiameter / 2 + gap / 2) * Global.zoom);
            graphics.endFill();
         }
         while(numChildren > 0)
         {
            removeChildAt(0);
         }
      }
   }
}

