package com.partkart
{
   import flash.display.*;
   import flash.events.*;
   
   public class Grid extends Sprite
   {
      
      private var xaxis:Sprite;
      
      private var yaxis:Sprite;
      
      private var grid:Sprite;
      
      private var gridlines:Array;
      
      private var gridxnum:int;
      
      private var gridynum:int;
      
      private var yoffset:int = 0;
      
      private var xoffset:int = 0;
      
      private var horizlines:Sprite;
      
      private var vertlines:Sprite;
      
      private var i:int;
      
      public function Grid()
      {
         super();
         this.init();
      }
      
      public function init() : void
      {
         this.horizlines = new Sprite();
         this.vertlines = new Sprite();
         this.gridlines = new Array();
         this.grid = new Sprite();
         this.xaxis = new Sprite();
         this.yaxis = new Sprite();
         this.drawBlank();
         this.drawAxes();
         this.drawGrid();
         addChild(this.grid);
         this.grid.addChild(this.horizlines);
         this.grid.addChild(this.vertlines);
      }
      
      private function drawBlank() : void
      {
         var blank:Shape = new Shape();
         blank.graphics.beginFill(16777215);
         blank.graphics.drawRect(0,0,Global.docwidth,Global.docheight);
         blank.graphics.endFill();
         blank.alpha = 0;
         addChild(blank);
      }
      
      private function drawAxes() : void
      {
         var xg:Graphics = null;
         var yg:Graphics = this.yaxis.graphics;
         xg = this.xaxis.graphics;
         yg.lineStyle(1,0,0.5,true,LineScaleMode.NONE);
         yg.moveTo(0,0);
         yg.lineTo(0,Global.docheight);
         this.yaxis.x = Global.xorigin;
         xg.lineStyle(1,0,0.5,true,LineScaleMode.NONE);
         xg.moveTo(0,0);
         xg.lineTo(Global.docwidth,0);
         this.xaxis.y = Global.yorigin;
         addChild(this.yaxis);
         addChild(this.xaxis);
      }
      
      private function redrawAxes() : void
      {
         this.xaxis.y = Global.yorigin;
         this.yaxis.x = Global.xorigin;
      }
      
      private function drawGrid() : void
      {
         this.gridxnum = Math.ceil(Global.docwidth / Global.zoom);
         this.gridynum = Math.ceil(Global.docheight / Global.zoom);
         this.yoffset = Global.yorigin - Math.floor(Global.yorigin / Global.zoom) * Global.zoom;
         this.xoffset = Global.xorigin - Math.floor(Global.xorigin / Global.zoom) * Global.zoom;
         var ypos:int = 0;
         var xpos:int = 0;
         for(this.i = 0; this.i <= this.gridynum; ++this.i)
         {
            ypos = this.i * Global.zoom + this.yoffset;
            if(ypos != 0)
            {
               this.gridlines[this.i] = new Shape();
               this.drawHorizLine(this.gridlines[this.i]);
               this.gridlines[this.i].y = ypos;
            }
         }
         for(this.i = 0; this.i <= this.gridxnum; ++this.i)
         {
            xpos = this.i * Global.zoom + this.xoffset;
            if(xpos != 0)
            {
               this.gridlines[this.i] = new Shape();
               this.drawVertLine(this.gridlines[this.i]);
               this.gridlines[this.i].x = xpos;
            }
         }
      }
      
      public function redrawGrid() : void
      {
         if(Global.zoom < 10)
         {
            this.redrawGridLarge();
            return;
         }
         this.graphics.clear();
         this.gridxnum = Math.ceil(Global.docwidth / Global.zoom);
         this.gridynum = Math.ceil(Global.docheight / Global.zoom);
         this.yoffset = Global.yorigin - Math.floor(Global.yorigin / Global.zoom) * Global.zoom;
         this.xoffset = Global.xorigin - Math.floor(Global.xorigin / Global.zoom) * Global.zoom;
         var ypos:int = 0;
         var xpos:int = 0;
         for(this.i = 0; this.i < this.horizlines.numChildren; ++this.i)
         {
            ypos = this.i * Global.zoom + this.yoffset;
            this.horizlines.getChildAt(this.i).y = ypos;
         }
         for(this.i = 0; this.i < this.vertlines.numChildren; ++this.i)
         {
            xpos = this.i * Global.zoom + this.xoffset;
            this.vertlines.getChildAt(this.i).x = xpos;
         }
         if(this.gridynum > this.horizlines.numChildren)
         {
            for(this.i = this.horizlines.numChildren; this.i <= this.gridynum; ++this.i)
            {
               ypos = this.i * Global.zoom + this.yoffset;
               if(ypos != 0)
               {
                  this.gridlines[this.i] = new Shape();
                  this.drawHorizLine(this.gridlines[this.i]);
                  this.gridlines[this.i].y = ypos;
               }
            }
         }
         else if(this.gridynum < this.horizlines.numChildren)
         {
            while(this.horizlines.numChildren > this.gridynum)
            {
               this.horizlines.removeChildAt(this.gridynum);
            }
         }
         if(this.gridxnum > this.vertlines.numChildren)
         {
            for(this.i = this.vertlines.numChildren; this.i <= this.gridxnum; ++this.i)
            {
               xpos = this.i * Global.zoom + this.xoffset;
               if(xpos != 0)
               {
                  this.gridlines[this.i] = new Shape();
                  this.drawVertLine(this.gridlines[this.i]);
                  this.gridlines[this.i].x = xpos;
               }
            }
         }
         else if(this.gridxnum < this.vertlines.numChildren)
         {
            while(this.vertlines.numChildren > this.gridxnum)
            {
               this.vertlines.removeChildAt(this.gridxnum);
            }
         }
      }
      
      public function redrawGridLarge() : void
      {
         this.graphics.beginFill(15658734);
         this.graphics.drawRect(0,0,this.width,this.height);
         this.graphics.endFill();
         var offset:* = 0;
         if(Global.unit == "cm")
         {
            offset = 100;
         }
         else
         {
            offset = 12;
         }
         this.gridxnum = Math.ceil(Global.docwidth / (Global.zoom * offset));
         this.gridynum = Math.ceil(Global.docheight / (Global.zoom * offset));
         this.yoffset = Global.yorigin - Math.floor(Global.yorigin / (Global.zoom * offset)) * Global.zoom * offset;
         this.xoffset = Global.xorigin - Math.floor(Global.xorigin / (Global.zoom * offset)) * Global.zoom * offset;
         var ypos:int = 0;
         var xpos:int = 0;
         for(this.i = 0; this.i < this.horizlines.numChildren; ++this.i)
         {
            ypos = this.i * Global.zoom * offset + this.yoffset;
            this.horizlines.getChildAt(this.i).y = ypos;
         }
         for(this.i = 0; this.i < this.vertlines.numChildren; ++this.i)
         {
            xpos = this.i * Global.zoom * offset + this.xoffset;
            this.vertlines.getChildAt(this.i).x = xpos;
         }
         if(this.gridynum > this.horizlines.numChildren)
         {
            for(this.i = this.horizlines.numChildren; this.i <= this.gridynum; ++this.i)
            {
               ypos = this.i * Global.zoom * offset + this.yoffset;
               if(ypos != 0)
               {
                  this.gridlines[this.i] = new Shape();
                  this.drawHorizLine(this.gridlines[this.i]);
                  this.gridlines[this.i].y = ypos;
               }
            }
         }
         else if(this.gridynum < this.horizlines.numChildren)
         {
            while(this.horizlines.numChildren > this.gridynum)
            {
               this.horizlines.removeChildAt(this.gridynum);
            }
         }
         if(this.gridxnum > this.vertlines.numChildren)
         {
            for(this.i = this.vertlines.numChildren; this.i <= this.gridxnum; ++this.i)
            {
               xpos = this.i * Global.zoom * offset + this.xoffset;
               if(xpos != 0)
               {
                  this.gridlines[this.i] = new Shape();
                  this.drawVertLine(this.gridlines[this.i]);
                  this.gridlines[this.i].x = xpos;
               }
            }
         }
         else if(this.gridxnum < this.vertlines.numChildren)
         {
            while(this.vertlines.numChildren > this.gridxnum)
            {
               this.vertlines.removeChildAt(this.gridxnum);
            }
         }
      }
      
      private function drawHorizLine(line:Shape) : void
      {
         for(var j:* = 0; j < Global.docwidth; j += 4)
         {
            line.graphics.beginFill(10066329);
            line.graphics.drawRect(j,0,1,1);
            line.graphics.endFill();
         }
         this.horizlines.addChild(line);
      }
      
      private function drawVertLine(line:Shape) : void
      {
         for(var j:* = 0; j < Global.docheight; j += 4)
         {
            line.graphics.beginFill(10066329);
            line.graphics.drawRect(0,j,1,1);
            line.graphics.endFill();
         }
         this.vertlines.addChild(line);
      }
      
      public function setOrigin() : void
      {
         this.redrawAxes();
         this.redrawGrid();
      }
      
      public function clear() : void
      {
         while(numChildren > 0)
         {
            removeChildAt(0);
         }
      }
   }
}

