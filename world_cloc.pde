/* WORLD CLOCK
 By Will Jennings and Alex Dodge
 September 26, 2010 - ITP
 based on:
 BAUHAUS CLOCKS - s-m-h-d
 By Alex Dodge and Genevieve Hoffman
 September 21, 2010 - ITP*/

float tzone = 0; //Sets the TimeZone variable
float t = ((second()/3600.0)+(minute()/60.0)+hour())*30.0; //Sets the current time(hh:mm:ss) start position
float mc = second()*6; //Sets the current minutes start position 
float D = ((second()/3600.0)+(minute()/60.0)+hour())*15.0;  //Sets the current day start position
PImage b; //Map Image
int mcX = 130; //Sets the map indicator to NYC  
int mcY = 568; //Sets the map indicator to NYC 
float cTime;//Color-Time 
float bright;//Color-time brightness

String displayString; 
int clX, clY; //city Location 
int circX, circY; 

void setup() {
  size(500, 750);
  background(255);
  smooth();
  noStroke();

  PFont font;
  font = loadFont("HelveticaNeue-UltraLight-48.vlw"); 
  textFont(font, 24);

  b = loadImage("world_1.png"); //Loads the map image

    displayString = "New York"; 
  clX = 132;
  clY = 567;
}

void draw() {  



  if (mouseY > 500) {
    cursor(CROSS);
  } 
  else {
    cursor(ARROW);
  }


  //Sets Color mode to HSB (for clock)
  colorMode(HSB, 360, 100, 100, 100);

  //Day Hemisphere
  //float d = map(norm(minute()+(millis()/60000), 0, 60), 0, 24, 0, 360);
  float d = map(norm(millis(), 0, 86400000), 0, 24, 0, 360); //Maps the Day rate
  fill(120, 100, bright/2, 19.6); 
  arc(250, 250, 400, 400, radians(-90+d+D+(tzone*15.0)), radians(90+d+D+(tzone*15.0)));

  //Hours Hemisphere
  //float h = map(norm(hour()+(minute()+(millis()/60000), 0, 60), 0, 12, 0, 360);
  float h = map(norm(millis(), 0, 3600000), 0, 12, 0, 360); //Maps the hours rate
  fill(60, 100, bright, 19.6); 
  arc(250, 250, 300, 300, radians(-90+h+t+(tzone*30.0)), radians(90+h+t+(tzone*30)));

  //Minutes Hemisphere
  float m = map(millis(), 0, 60000, 0, 360);
  fill(240, 100, bright, 19.6); 
  arc(250, 250, 200, 200, radians(-90+m+mc), radians(90+m+mc));

  //Seconds Hemisphere
  float s = map(millis(), 0, 1000, 0, 360);
  fill(0, 100, bright, 19.6); 
  arc(250, 250, 100, 100, radians(-90+s), radians(90+s));

  //Sets color back to RGB
  colorMode(RGB, 255, 255, 255, 255);

  //Sets timezone ranges along the x-axis (Not so geographically accurate)
  ZoneRange(0, 16, 18); //GMT-11
  ZoneRange(16, 24, 19); //GMT-10
  ZoneRange(24, 60, 20); //GMT-9
  ZoneRange(60, 83, 21); //GMT-8
  ZoneRange(83, 90, 22); //GMT-7
  ZoneRange(90, 120, 23); //GMT-6
  ZoneRange(120, 139, 0); //GMT-5 <(Eastern Time)
  ZoneRange(139, 160, 1); //GMT-4
  ZoneRange(160, 189, 2); //GMT-3
  ZoneRange(189, 190, 3); //GMT-2
  ZoneRange(190, 208, 4); //GMT-1
  ZoneRange(208, 232, 5); //GMT(0)
  ZoneRange(232, 260, 6); //GMT+1
  ZoneRange(260, 274, 7); //GMT+2
  ZoneRange(274, 309, 8); //GMT+3
  ZoneRange(309, 320, 9); //GMT+4
  ZoneRange(320, 330, 10); //GMT+5
  ZoneRange(330, 350, 11); //GMT+6
  ZoneRange(350, 410, 12); //GMT+7
  ZoneRange(410, 440, 13); //GMT+8
  ZoneRange(440, 450, 14); //GMT+9
  ZoneRange(450, 460, 15); //GMT+10
  ZoneRange(460, 470, 16); //GMT+11
  ZoneRange(470, 500, 17); //GMT+12

  //Map Image 

  fill (255, 255, 255, 255); 
  rect (0, 510, width, b.width); 

  tint(255, 255, 255, 150); //Tint with alpha for text fade
  image(b, -15, 510, width, height - 500);
  tint (255, 255, 255, 255); 

  //Lists City Names and sets ocations
  city("Anchorage", 27, 533);
  city("Los Angeles", 68, 571);
  city("Salt Lake City", 75, 562);
  city("Mexico City", 97, 596);
  city("Dallas", 99, 578);
  city("Chicago", 115, 559);
  city("Santiago", 136, 683);
  city("Buenos Aires", 156, 682);
  city("Bogota", 134, 623);
  city("Caracas", 139, 612);
  city("Ottawa", 128, 556);
  city("New York", 132, 567);
  city("Brasilia", 165, 653);
  city("Halifax", 157, 552);
  city("Nuuk", 165, 526);
  city("Reykjavik", 210, 528);
  city("London", 232, 546);
  city("Barcelona", 231, 563);
  city("Dakar", 210, 604);
  city("Paris", 242, 553);
  city("Rome", 258, 564);
  city("Berlin", 253, 545);
  city("Belarus", 272, 544);
  city("Warsaw", 265, 546);
  city("Moscow", 284, 542);
  city("Athens", 270, 566);
  city("Tehran", 309, 571);
  city("Dubai", 307, 588);
  city("Astana", 329, 548);
  city("Mumbai", 336, 593);
  city("Dhaka", 359, 591);
  city("Bangkok", 376, 609);
  city("Jakarta", 383, 637);
  city("Beijing", 397, 568);
  city("Tokyo", 429, 571);
  city("Port Moresby", 435, 639);
  city("Brisbaine", 447, 673);
  city("Wellington", 475, 694);
  city("Magadan", 480, 529);
  city("Port Elizabeth", 273, 681);
  city("Walbis Bay", 256, 663);
  city("Luanda", 256, 641);
  city("Abuja", 247, 615);
  city("Djibouti", 293, 614);
  city("Cairo", 280, 579);
  city("Amman", 286, 575);
  city("Banghazi", 266, 578);
  city("Chartoun", 281, 602);
  city("Dar es Salaam", 288, 635);
  city("Antananavaro", 299, 658);

  mapCursor();
  /*
  ellipseMode(CENTER);
   fill(255,0,0,25);
   ellipse(mcX,mcY,10,10);
   */

  //Changes colors with time
  cTime = (hour() + tzone) % 24;

  if (cTime >= 12) {
    bright = map(cTime, 12, 24, 100, 0);
  } 
  else {
    bright = map(cTime, 0, 12, 0, 100);
  }

  fill(50);
  if (clX < width - 100) {
    textAlign (LEFT, CENTER); 
  } else {
     textAlign (RIGHT, CENTER); 
  }
  text (displayString, clX + 5, clY); 
  fill (255, 0, 0, 25); 
  ellipse (circX, circY, 10, 10);
  fill (255); 
  ellipse (circX, circY, 7, 7);


  //semi-opaque matte - creates the fade gradient
  fill(255, 255, 255, 10); 
  rect(0, 0, 500, height - 500 );
}

void mapCursor() { 
  if (mousePressed && mouseY >= 505) { 
    mcX = mouseX;
    mcY = mouseY;
  }
}

//City location function
void city(String city, int xCoord, int yCoord) {

  int circleSize = 10; 

  if ((mouseX >= (xCoord-5)) && (mouseX <= (xCoord+5) && (mouseY >= (yCoord-5)) && (mouseY <= (yCoord+5)))) {
    fill(50);
    //text(city, xCoord+4, yCoord-4);
    displayString = city; 
    clX = xCoord;
    clY = yCoord;
  } 
 

    noStroke(); 
    fill(255, 0, 0, 100);
    ellipse (xCoord, yCoord, circleSize, circleSize);
  
  //Sets text to right of cursor when not over right edge
  if (mouseX < 426) {
    textAlign(LEFT);
  }
  //Sets text to left of cursor when over right edge
  else if (mouseX > 426) {
    textAlign(RIGHT);
  }
}

//Time zone range function
void ZoneRange(int MouseXMin, int MouseXMax, float TimeVar) {
  if (mousePressed && (mouseY >= 500) && mouseX >= MouseXMin && mouseX <= MouseXMax) { 
    tzone = TimeVar;
    circX = clX; 
    circY = clY; 
  }
}


