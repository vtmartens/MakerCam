package com.partkart
{
   import com.greenthreads.*;
   import com.tink.display.HitTest;
   import flash.display.Bitmap;
   import flash.display.BitmapData;
   import flash.display.Sprite;
   import flash.geom.Matrix;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   
   public class Nest extends GreenThread
   {
      
      public var blank:Path;
      
      public var blankbitmap:BitmapData;
      
      private var blankoriginal:BitmapData;
      
      private var blankweight:Number;
      
      private var nestbitmap:BitmapData;
      
      private var gap:Number;
      
      public var cutlist:Array;
      
      private var weightlist:Array;
      
      private var current:int = 0;
      
      private var currentrotation:Number = 0;
      
      private var objectlist:Array;
      
      public var scale:Number = 1;
      
      private var divisions:int = 4;
      
      private var bestangle:Object;
      
      private var ga:GeneticAlgorithm;
      
      private var currentindividual:Individual;
      
      public var fittest:Individual;
      
      private var renderbitmap:Bitmap;
      
      public var underlimit:Boolean = false;
      
      private var group:Boolean = true;
      
      private var groupprofile:Boolean = false;
      
      public function Nest(inputblank:Path, inputcutlist:Array, inputdivisions:int = 4, inputgap:Number = 0, inputgroup:Boolean = true, inputgroupprofile:Boolean = false)
      {
         super();
         this.blank = inputblank;
         this.cutlist = inputcutlist;
         this.divisions = inputdivisions;
         this.gap = inputgap;
         this.group = inputgroup;
         this.groupprofile = inputgroupprofile;
      }
      
      override protected function initialize() : void
      {
         var cut:* = undefined;
         var i:* = 0;
         var j:* = 0;
         var weight:Number = NaN;
         var rect:Rectangle = null;
         var matrix:Matrix = null;
         var weightbitmap:BitmapData = null;
         var total:uint = 0;
         var k:int = 0;
         for each(cut in this.cutlist)
         {
            cut.zeroOrigin();
            cut.drawNestBlank(0,this.gap);
         }
         if(this.group == true)
         {
            for(i = 0; i < this.cutlist.length; i++)
            {
               for(j = 0; j < this.cutlist.length; j++)
               {
                  if(!(this.cutlist[j] is ProfileCutObject) || this.cutlist[j] is ProfileCutObject && this.groupprofile == true)
                  {
                     if(i != j && HitTest.complexHitTestObject(this.cutlist[i],this.cutlist[j]))
                     {
                        this.cutlist[i].addChild(this.cutlist[j]);
                        this.cutlist.splice(j,1);
                        if(i >= j)
                        {
                           i--;
                        }
                        j--;
                     }
                  }
               }
            }
         }
         if(this.cutlist.length < 2)
         {
            this.underlimit = true;
            return;
         }
         this.cutlist.sort(this.sortarea);
         this.weightlist = new Array();
         for(i = 0; i < this.cutlist.length; i++)
         {
            weight = 0;
            rect = this.cutlist[i].getBounds(this);
            matrix = new Matrix(1,0,0,1,-rect.x,-rect.y);
            weightbitmap = new BitmapData(rect.width,rect.height,false,16777215);
            weightbitmap.draw(this.cutlist[i],matrix);
            total = 0;
            for(j = 0; j < weightbitmap.width; j++)
            {
               for(k = 0; k < weightbitmap.height; k++)
               {
                  if(weightbitmap.getPixel(j,k) == 0)
                  {
                     total++;
                  }
               }
            }
            weight = total / (Global.zoom * Global.zoom);
            this.weightlist.push(weight);
            weightbitmap.dispose();
         }
         var cutobject:PocketCutObject = new PocketCutObject();
         cutobject.pathlist = new Array(this.blank);
         addChild(cutobject);
         cutobject.drawNestBlank(16777215);
         var region:Rectangle = cutobject.getBounds(this);
         var bitmapwidth:Number = region.width;
         var bitmapheight:Number = region.height;
         if(region.width > region.height)
         {
            this.scale = Global.nestbitmapsize / region.width;
            bitmapwidth = Global.nestbitmapsize;
            bitmapheight = region.height * this.scale;
         }
         else
         {
            this.scale = Global.nestbitmapsize / region.height;
            bitmapwidth = region.width * this.scale;
            bitmapheight = Global.nestbitmapsize;
         }
         var trans:Matrix = new Matrix(this.scale,0,0,this.scale,-region.x * this.scale,-region.y * this.scale);
         this.blankbitmap = new BitmapData(region.width * this.scale,region.height * this.scale,false,0);
         this.blankbitmap.draw(cutobject,trans);
         this.blankoriginal = this.blankbitmap.clone();
         this.nestbitmap = new BitmapData(this.blankbitmap.width,this.blankbitmap.height,true,0);
         this.blankweight = 0;
         for(i = 0; i < this.blankbitmap.width; i++)
         {
            for(j = 0; j < this.blankbitmap.height; j++)
            {
               if(this.blankbitmap.getPixel(i,j) == 16777215)
               {
                  ++this.blankweight;
               }
            }
         }
         this.blankweight /= Global.zoom * Global.zoom * this.scale * this.scale;
         var blankrect:Rectangle = this.blank.getBounds(this);
         this.renderbitmap = new Bitmap(this.nestbitmap.clone());
         this.renderbitmap.width = blankrect.width;
         this.renderbitmap.height = blankrect.height;
         this.renderbitmap.x = blankrect.x;
         this.renderbitmap.y = blankrect.y;
         addChild(this.renderbitmap);
         removeChild(cutobject);
         _maximum = 100;
      }
      
      private function sortarea(a:*, b:*) : Number
      {
         var area1:int = a.width * a.height;
         var area2:int = b.width * b.height;
         if(area1 > area2)
         {
            return -1;
         }
         if(area1 < area2)
         {
            return 1;
         }
         return 0;
      }
      
      override protected function run() : Boolean
      {
         var obj:Object = null;
         var pending:Array = null;
         var adam:Individual = null;
         var genes:Array = null;
         var i:int = 0;
         var fitness:Number = NaN;
         var rect:Rectangle = null;
         var area:Number = NaN;
         var currentfitness:Number = NaN;
         var tempbitmap:BitmapData = null;
         if(this.underlimit == true)
         {
            return false;
         }
         if(this.fittest != null)
         {
            _progress = this.fittest.fitness / this.blankweight * 100;
         }
         if(this.current >= this.cutlist.length)
         {
            if(this.ga == null)
            {
               adam = new Individual();
               genes = new Array();
               for(i = 0; i < this.objectlist.length; i++)
               {
                  genes.push(this.objectlist[i].index);
               }
               adam.genes = genes;
               adam.data = this.objectlist;
               fitness = 0;
               for(i = 0; i < this.objectlist.length; i++)
               {
                  if(!this.objectlist[i].failed)
                  {
                     fitness += this.weightlist[this.objectlist[i].index];
                  }
               }
               adam.fitness = fitness;
               rect = this.nestbitmap.getColorBoundsRect(4294967295,4278190080);
               area = rect.width * rect.height;
               adam.secondaryfitness = 100 / area;
               this.ga = new GeneticAlgorithm(adam);
               this.fittest = adam;
               this.renderbitmap.bitmapData.dispose();
               this.renderbitmap.bitmapData = this.nestbitmap.clone();
            }
            else
            {
               this.currentindividual.data = this.objectlist;
               currentfitness = 0;
               for(i = 0; i < this.objectlist.length; i++)
               {
                  if(!this.objectlist[i].failed)
                  {
                     currentfitness += this.weightlist[this.objectlist[i].index];
                  }
               }
               this.currentindividual.fitness = currentfitness;
               rect = this.nestbitmap.getColorBoundsRect(4294967295,4278190080);
               area = rect.width * rect.height;
               this.currentindividual.secondaryfitness = 100 / area;
               if(this.ga.sortByFitness(this.currentindividual,this.fittest) == -1)
               {
                  this.fittest = this.currentindividual;
                  this.renderbitmap.bitmapData.dispose();
                  this.renderbitmap.bitmapData = this.nestbitmap.clone();
               }
               trace("fitness: ",this.currentindividual.fitness,"fitness2: ",this.currentindividual.secondaryfitness);
            }
            pending = this.ga.getPending();
            if(pending.length == 0)
            {
               this.ga.generationStep();
               trace("next generation!");
               pending = this.ga.getPending();
            }
            this.currentindividual = pending[0];
            this.current = 0;
            this.currentrotation = 0;
            this.blankbitmap.dispose();
            this.nestbitmap.dispose();
            this.blankbitmap = this.blankoriginal.clone();
            this.nestbitmap = new BitmapData(this.blankbitmap.width,this.blankbitmap.height,true,0);
            this.objectlist = null;
         }
         if(this.currentrotation >= 360)
         {
            obj = new Object();
            if(this.bestangle == null)
            {
               obj.i = 0;
               obj.j = 0;
               obj.index = this.currentindividual == null ? this.current : this.currentindividual.genes[this.current];
               obj.rotation = 0;
               obj.failed = true;
               if(this.objectlist == null)
               {
                  this.objectlist = new Array();
               }
               this.objectlist.push(obj);
            }
            else
            {
               this.blankbitmap.copyPixels(this.bestangle.bitmapdata,new Rectangle(0,0,this.bestangle.bitmapdata.width,this.bestangle.bitmapdata.height),new Point(this.bestangle.i,this.bestangle.j),this.bestangle.bitmapdata,new Point(0,0),true);
               this.nestbitmap.copyPixels(this.bestangle.bitmapdata,new Rectangle(0,0,this.bestangle.bitmapdata.width,this.bestangle.bitmapdata.height),new Point(this.bestangle.i,this.bestangle.j),this.bestangle.bitmapdata,new Point(0,0),true);
               if(this.objectlist == null)
               {
                  this.objectlist = new Array();
               }
               obj.i = this.bestangle.i;
               obj.j = this.bestangle.j;
               obj.x = this.bestangle.x;
               obj.y = this.bestangle.y;
               obj.index = this.currentindividual == null ? this.current : this.currentindividual.genes[this.current];
               obj.rotation = this.bestangle.rotation;
               this.objectlist.push(obj);
               this.bestangle.bitmapdata.dispose();
               this.bestangle = null;
            }
            this.currentrotation = 0;
            ++this.current;
         }
         obj = this.place();
         if(obj != null)
         {
            tempbitmap = this.nestbitmap.clone();
            tempbitmap.copyPixels(obj.bitmapdata,new Rectangle(0,0,obj.bitmapdata.width,obj.bitmapdata.height),new Point(obj.i,obj.j),obj.bitmapdata,new Point(0,0),true);
            rect = tempbitmap.getColorBoundsRect(4294967295,4278190080);
            tempbitmap.dispose();
            obj.area = rect.width * rect.height;
            if(this.bestangle == null || this.bestangle.area > obj.area)
            {
               if(this.bestangle != null)
               {
                  this.bestangle.bitmapdata.dispose();
               }
               this.bestangle = obj;
            }
            else
            {
               obj.bitmapdata.dispose();
            }
         }
         this.currentrotation += 360 / this.divisions;
         return true;
      }
      
      private function place() : Object
      {
         var nestobject:* = undefined;
         if(this.currentindividual == null)
         {
            nestobject = this.cutlist[this.current];
         }
         else
         {
            nestobject = this.cutlist[this.currentindividual.genes[this.current]];
         }
         if(nestobject == null)
         {
            return null;
         }
         var tempsprite:Sprite = new Sprite();
         addChild(tempsprite);
         tempsprite.addChild(nestobject);
         nestobject.rotation = this.currentrotation;
         var region:Rectangle = tempsprite.getBounds(this);
         if(region.width * this.scale > this.blankbitmap.width || region.height * this.scale > this.blankbitmap.height)
         {
            return null;
         }
         var trans:Matrix = new Matrix();
         trans.scale(this.scale,this.scale);
         trans.translate(-region.x * this.scale,-region.y * this.scale);
         var nestbitmap:BitmapData = new BitmapData(region.width * this.scale,region.height * this.scale,true,0);
         nestbitmap.draw(tempsprite,trans);
         removeChild(tempsprite);
         var i:int = 0;
         var j:int = this.blankbitmap.height - nestbitmap.height;
         var overlap:Rectangle = this.getOverlap(nestbitmap,i,j);
         while(overlap.width > 0)
         {
            i += overlap.width + 1;
            if(i + nestbitmap.width > this.blankbitmap.width)
            {
               j -= nestbitmap.height / 10;
               i = 0;
            }
            if(j < 0)
            {
               nestbitmap.dispose();
               return null;
            }
            overlap = this.getOverlap(nestbitmap,i,j);
         }
         var obj:Object = new Object();
         obj.i = i;
         obj.j = j;
         obj.x = region.x;
         obj.y = region.y;
         obj.bitmapdata = nestbitmap;
         obj.rotation = this.currentrotation;
         return obj;
      }
      
      private function getOverlap(nestbitmap:BitmapData, i:int, j:int) : Rectangle
      {
         var intersectbitmap:BitmapData = new BitmapData(nestbitmap.width,nestbitmap.height,true,0);
         intersectbitmap.copyPixels(this.blankbitmap,new Rectangle(i,j,nestbitmap.width,nestbitmap.height),new Point(0,0),nestbitmap,new Point(0,0));
         var intersectrect:Rectangle = intersectbitmap.getColorBoundsRect(4294967295,4278190080);
         intersectbitmap.dispose();
         return intersectrect;
      }
      
      public function finish() : void
      {
         if(this.blankbitmap)
         {
            this.blankbitmap.dispose();
         }
         if(this.blankoriginal)
         {
            this.blankoriginal.dispose();
         }
         if(this.nestbitmap)
         {
            this.nestbitmap.dispose();
         }
      }
   }
}

