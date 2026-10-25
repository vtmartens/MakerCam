package com.partkart
{
   import com.adobe.images.JPGEncoder;
   import com.adobe.serialization.json.*;
   import com.tink.display.HitTest;
   import flash.display.BitmapData;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.IOErrorEvent;
   import flash.events.ProgressEvent;
   import flash.external.ExternalInterface;
   import flash.geom.Matrix;
   import flash.geom.Rectangle;
   import flash.net.URLLoader;
   import flash.net.URLRequest;
   import flash.net.URLRequestMethod;
   import flash.utils.ByteArray;
   
   public class PartKart
   {
      
      private var main:*;
      
      private var progressdialog:ProgressDialog;
      
      private var loader:URLLoader;
      
      private var posturl:String = "/factory/order";
      
      private var maxbitmap:int = 200;
      
      private var avoidoverlap:Boolean = false;
      
      public function PartKart(parent:*)
      {
         super();
         this.main = parent;
         try
         {
            ExternalInterface.addCallback("openfile",this.openfile);
         }
         catch(e:Error)
         {
         }
      }
      
      public function openfile(url:String, overlap:Boolean = false) : void
      {
         var request:URLRequest;
         this.avoidoverlap = overlap;
         if(Global.tool == 99)
         {
            return;
         }
         request = new URLRequest(url);
         this.loader = new URLLoader();
         try
         {
            this.loader.load(request);
         }
         catch(error:SecurityError)
         {
            main.startDialog(240,50,new Array({
               "type":"label",
               "label":"could not open file"
            }),"error");
            return;
         }
         this.loader.addEventListener(IOErrorEvent.IO_ERROR,this.openfileError);
         this.loader.addEventListener(Event.COMPLETE,this.openfileComplete);
         this.loader.addEventListener(ProgressEvent.PROGRESS,this.openfileProgress);
         this.progressdialog = this.main.startProgressDialog(250,75,"Opening File","Cancel",this.openfileClose);
         this.progressdialog.init(1);
      }
      
      protected function openfileClose() : void
      {
         this.loader.close();
         this.progressdialog.stopDialog();
         this.progressdialog = null;
         this.loader.removeEventListener(IOErrorEvent.IO_ERROR,this.openfileError);
         this.loader.removeEventListener(Event.COMPLETE,this.openfileComplete);
         this.loader.removeEventListener(ProgressEvent.PROGRESS,this.openfileProgress);
         this.loader = null;
      }
      
      protected function openfileError(e:IOErrorEvent) : void
      {
         this.openfileClose();
         this.main.startDialog(240,50,new Array({
            "type":"label",
            "label":"could not open file"
         }),"error");
      }
      
      protected function openfileProgress(e:ProgressEvent) : void
      {
         this.progressdialog.setProgress(e.bytesLoaded / e.bytesTotal);
      }
      
      protected function openfileComplete(e:Event) : void
      {
         var data:* = this.loader.data;
         this.openfileClose();
         this.main.scene.setInactive();
         var sloader:SVGLoader = new SVGLoader(this.main);
         sloader.clean = false;
         sloader.load(data);
         this.main.scene.redraw();
         this.main.scene.shiftActive();
         ExternalInterface.call("openComplete");
      }
      
      public function order(cutlist:Array) : void
      {
         var cut:* = undefined;
         var groups:Array = null;
         var i:* = 0;
         var url:URLRequest = null;
         var j:* = 0;
         var glist:Array = null;
         var gcutlist:Array = null;
         var gpathlist:Array = null;
         var dummy:Sprite = null;
         var c:* = undefined;
         var region:Rectangle = null;
         var bitmapwidth:Number = NaN;
         var bitmapheight:Number = NaN;
         var scale:Number = NaN;
         var trans:Matrix = null;
         var gthumb:BitmapData = null;
         var enc:JPGEncoder = null;
         var gthumbjpeg:ByteArray = null;
         var gthumb64:String = null;
         var writer:SVGWriter = null;
         var svg:String = null;
         var obj:Object = null;
         var k:int = 0;
         var p:Path = null;
         if(!cutlist || cutlist.length == 0)
         {
            this.main.startDialog(240,50,new Array({
               "type":"label",
               "label":"no toolpaths to process"
            }),"error");
            return;
         }
         for each(cut in cutlist)
         {
            if(cut.stocksurface != 0 || cut.targetdepth >= 0)
            {
               this.main.startDialog(340,50,new Array({
                  "type":"label",
                  "label":"stock surface must be 0 and target depth must be negative!"
               }),"error");
               return;
            }
         }
         for each(cut in cutlist)
         {
            cut.zeroOrigin();
            cut.drawNestBlank(0,0);
            cut.processed = false;
         }
         groups = cutlist.slice();
         for(i = 0; i < groups.length; i++)
         {
            for(j = 0; j < groups.length; j++)
            {
               if(i != j && HitTest.complexHitTestObject(groups[i],groups[j]))
               {
                  groups[i].addChild(groups[j]);
                  groups.splice(j,1);
                  if(i >= j)
                  {
                     i--;
                  }
                  j--;
               }
            }
         }
         var objlist:Array = new Array();
         var groupedcuts:Array = new Array();
         for(i = 0; i < groups.length; i++)
         {
            cut = groups[i];
            glist = new Array(cut);
            for(j = 0; j < cutlist.length; j++)
            {
               if(cutlist[j] != cut && Boolean(cut.contains(cutlist[j])))
               {
                  glist.push(cutlist[j]);
               }
            }
            groupedcuts[i] = glist;
         }
         i = 0;
         for each(cut in groups)
         {
            gcutlist = groupedcuts[i];
            gpathlist = new Array();
            for(j = 0; j < gcutlist.length; j++)
            {
               for(k = 0; k < gcutlist[j].pathlist.length; k++)
               {
                  if(gpathlist.indexOf(gcutlist[j].pathlist[k]) == -1)
                  {
                     gpathlist.push(gcutlist[j].pathlist[k]);
                  }
               }
            }
            dummy = new Sprite();
            for each(c in gcutlist)
            {
               dummy.addChild(c);
               c.redraw();
               for each(p in c.pathlist)
               {
                  dummy.addChild(p);
                  p.redraw();
               }
            }
            this.main.scene.addChild(dummy);
            region = dummy.getBounds(this.main.scene);
            bitmapwidth = region.width;
            bitmapheight = region.height;
            scale = 1;
            if(region.width > region.height)
            {
               scale = this.maxbitmap / region.width;
               bitmapwidth = this.maxbitmap;
               bitmapheight = region.height * scale;
            }
            else
            {
               scale = this.maxbitmap / region.height;
               bitmapwidth = region.width * scale;
               bitmapheight = this.maxbitmap;
            }
            trans = new Matrix(scale,0,0,scale,-region.x * scale,-region.y * scale);
            gthumb = new BitmapData(region.width * scale,region.height * scale,false);
            gthumb.draw(dummy,trans);
            enc = new JPGEncoder(80);
            gthumbjpeg = enc.encode(gthumb);
            gthumb64 = Base64.encode(gthumbjpeg);
            gthumb.dispose();
            this.main.scene.removeChild(dummy);
            writer = new SVGWriter(gpathlist,gcutlist);
            svg = writer.parse();
            obj = new Object();
            obj.svg = svg;
            obj.unit = Global.unit == "in" ? "0" : "1";
            obj.thumbnail = gthumb64;
            objlist.push(obj);
            i++;
         }
         url = new URLRequest(this.posturl);
         url.method = URLRequestMethod.POST;
      }
      
      protected function orderError(e:IOErrorEvent) : void
      {
         var loader:URLLoader = URLLoader(e.target);
         this.main.startDialog(200,50,new Array({
            "type":"label",
            "label":loader.data
         }),"error");
      }
      
      protected function orderComplete(e:Event) : void
      {
         var loader:URLLoader = URLLoader(e.target);
         if(loader.data == "success")
         {
            ExternalInterface.call("navigateParent","/user/orders/");
         }
         else
         {
            this.main.startDialog(200,50,new Array({
               "type":"label",
               "label":loader.data
            }),"error");
         }
      }
   }
}

