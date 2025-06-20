// Utility to get consistent random cover image for a designer
export function getDesignerCoverImage(designerId: number): string {
  // List of available cover images
  const coverImages = [
    'img-cover-1.png',
    'img-cover-2.png',
    'img-cover-3.png',
    'img-cover-4.png',
    'img-cover-5.png',
    'img-cover-6.png',
    'img-cover-7.png',
    'img-cover-8.png',
    'img-cover-9.png',
    'img-cover-10.png',
    'img-cover-11.png',
    'img-cover-12.png',
    'img-cover-13.png',
    'img-cover-14.png',
    'img-cover-15.png',
    'img-cover-16.png',
    'img-cover-17.png',
    'img-cover-18.png',
  ];

  // Use designer ID as seed for consistent random selection
  const index = designerId % coverImages.length;
  return `/images/card-covers/${coverImages[index]}`;
}