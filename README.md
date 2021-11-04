# Real-ESRGAN-Test

Windows 10

Left: real-esrgan portable  
https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/realesrgan-ncnn-vulkan-20210901-windows.zip
```
./realesrgan-ncnn-vulkan.exe -i ./images -o ./output
```

Right: ImageMagick 7.0.8-11 Q16 x64 2018-08-29
```
magick mogrify -path output-im -format jpg -quality 90 -resize 400% images/*.*
```

## Notes

Fabric texture becomes leather  
https://ser-gen.github.io/Real-ESRGAN-Test/#4e85b6fec8991_x.jpg

![image](https://user-images.githubusercontent.com/1856145/140294240-2aff84ae-a256-48e6-9eb1-37e96f6780bd.png)

Great landscape details
* https://ser-gen.github.io/Real-ESRGAN-Test/#4e85b6ff0d9a4_x.jpg
* https://ser-gen.github.io/Real-ESRGAN-Test/#biking.jpg

![image](https://user-images.githubusercontent.com/1856145/140305862-2cc39472-066f-4a98-8913-c58c673c8125.png)

Perfect plastic wrap  
https://ser-gen.github.io/Real-ESRGAN-Test/#4e85b6ffbd5e8_x.jpg

![image](https://user-images.githubusercontent.com/1856145/140306267-a75f7d86-5a3e-453d-98ea-52ca0a3140e1.png)

Distorted text is broken  
https://ser-gen.github.io/Real-ESRGAN-Test/#4e85b7d4c1f09_x.jpg

![image](https://user-images.githubusercontent.com/1856145/140306621-fa9ff2e4-8e90-4f63-82dd-2c23a6dfd63e.png)
