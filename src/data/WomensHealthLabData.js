/**
 * Data configuration for Women's Health Lab interactive 3D experiences.
 * Experience 01: Female Reproductive System (female_reproductive_system.glb)
 * Experience 02: Inside The Pelvis (bony_pelvis_optimized.glb - Web Optimized 3.65 MB)
 * Experience 03: Fetus (baby_optimized.glb - Web Optimized 0.94 MB)
 */

export const EXPERIENCES_DATA = [
  {
    id: 'anatomy',
    code: '01',
    title: 'ANATOMY',
    subtitle: 'Female Reproductive System',
    description: 'Explore the fundamental structures of reproductive health, fertility, and organ harmony.',
    modelPath: 'assets/models/female_reproductive_system.glb',
    defaultCameraPos: { x: 0, y: 0.5, z: 8 },
    isAvailable: true,
    structures: [
      {
        id: 'uterus',
        meshNames: ['UTERUS_3', 'Object_4', 'Object_5'],
        title: 'Uterus (Womb)',
        shortDesc: 'A muscular organ where a fertilized egg implants and develops during pregnancy.',
        whyItMatters: 'Essential for menstrual health, implantation, and nourishing fetal growth throughout pregnancy.'
      },
      {
        id: 'ovaries',
        meshNames: ['OVARIES_5', 'Object_11'],
        title: 'Ovaries',
        shortDesc: 'Dual glands responsible for producing eggs (oocytes) and key reproductive hormones.',
        whyItMatters: 'Regulate monthly menstrual cycles and release hormones like estrogen and progesterone essential for overall vitality.'
      },
      {
        id: 'fallopian_tubes',
        meshNames: ['TUBE_R.001_10', 'TUBE_L.001_11', 'Ov_Tube_R.002_12', 'Ov_Tube_R.003_13', 'Object_13', 'Object_15', 'Object_17', 'Object_19'],
        title: 'Fallopian Tubes (Oviducts)',
        shortDesc: 'Delicate muscular tubes connecting the ovaries to the uterine cavity on both right and left sides.',
        whyItMatters: 'The vital pathway where fertilization occurs and where the embryo is safely swept toward the uterus.'
      },
      {
        id: 'cervix',
        meshNames: ['WOMB_4', 'Object_9', 'Object_6', 'Object_7'],
        title: 'Cervix & Lower Uterine Segment',
        shortDesc: 'The lower narrow neck of the uterus connecting to the vaginal canal.',
        whyItMatters: 'Acts as a protective muscular gateway, producing cervical mucus to assist sperm transport and expanding during childbirth.'
      }
    ]
  },
  {
    id: 'pelvis',
    code: '02',
    title: 'INSIDE THE PELVIS',
    subtitle: 'Bony Pelvis & Pelvic Organs',
    description: 'Spatial anatomical exploration derived from pelvic MRI scan data.',
    modelPath: 'assets/models/bony_pelvis_optimized.glb',
    defaultCameraPos: { x: 0, y: 3.5, z: 11 },
    isAvailable: true,
    structures: [
      {
        id: 'bony_pelvis',
        meshNames: ['pelvis_9', 'sacrum_11', 'femur_3', 'L3_5', 'L4_6', 'L5_7', 'Object_38', 'Object_39', 'Object_40', 'Object_41', 'Object_42', 'Object_43', 'Object_44', 'Object_45', 'Object_53', 'Object_54', 'Object_55', 'Object_56'],
        title: 'Bony Pelvis & Sacrum',
        shortDesc: 'The rigid skeletal structure forming the pelvic girdle, protecting delicate internal pelvic organs.',
        whyItMatters: 'Provides structural support, anchors pelvic floor muscles, and forms the bony birth canal during delivery.'
      },
      {
        id: 'pelvic_uterus',
        meshNames: ['uterus-and-tubes_12', 'Object_58', 'Object_59', 'Object_60', 'Object_61', 'Object_62'],
        title: 'Uterus & Fallopian Tubes',
        shortDesc: 'The central reproductive organ positioned in the mid-pelvic cavity between the bladder and rectum.',
        whyItMatters: 'Demonstrates the anatomical spatial orientation of the reproductive organs within the bony pelvic framework.'
      },
      {
        id: 'pelvic_ovaries',
        meshNames: ['ovaries_8', 'Object_34', 'Object_35', 'Object_36'],
        title: 'Ovaries',
        shortDesc: 'Paired reproductive glands nestled against the lateral pelvic walls near the pelvic brim.',
        whyItMatters: 'Their precise anatomical positioning within the pelvis is critical during ovulation and transvaginal ultrasound imaging.'
      },
      {
        id: 'bladder',
        meshNames: ['bladder_1', 'Object_4', 'Object_5', 'Object_6', 'Object_7'],
        title: 'Urinary Bladder',
        shortDesc: 'A hollow muscular organ located directly in front of the uterus.',
        whyItMatters: 'Its close anterior relationship with the uterus explains why uterine enlargement or pregnancy increases urinary urgency.'
      },
      {
        id: 'rectum',
        meshNames: ['rectum_10', 'Object_47', 'Object_48', 'Object_49', 'Object_50', 'Object_51'],
        title: 'Rectum & Posterior Pelvis',
        shortDesc: 'The distal segment of the digestive tract positioned directly behind the uterus and vagina.',
        whyItMatters: 'Illustrates the compact arrangement of pelvic organs and explains posterior pelvic pressure or endometriosis involvement.'
      }
    ]
  },
  {
    id: 'fetus',
    code: '03',
    title: 'FETUS',
    subtitle: 'Understanding Fetal Position',
    description: 'Explore the orientation and position of the fetus through an interactive 3D model.',
    modelPath: 'assets/models/baby_optimized.glb',
    defaultCameraPos: { x: 0, y: 0, z: 7.5 },
    isAvailable: true,
    structures: [
      {
        id: 'fetal_head',
        meshNames: ['babytesta_obj_1__0', 'babytesta_obj_1'],
        title: 'Fetal Head (Cephalic Presentation)',
        shortDesc: 'In a vertex or cephalic presentation, the fetal head is oriented downward toward the maternal pelvic inlet.',
        whyItMatters: 'Cephalic presentation is the optimal fetal position for a natural vaginal delivery.'
      },
      {
        id: 'fetal_spine',
        meshNames: ['babycorpo_obj_1__0', 'babycorpo_obj_1'],
        title: 'Fetal Spine & Back Orientation',
        shortDesc: 'Describes the direction the baby’s back faces relative to the mother’s abdominal wall (anterior vs. posterior).',
        whyItMatters: 'Anterior positioning (back facing forward) allows the fetal head to flex and navigate pelvic curves smoothly.'
      },
      {
        id: 'fetal_flexion',
        meshNames: ['babycorpo_obj_1__0'],
        title: 'Fetal Attitude & Flexion',
        shortDesc: 'The compact flexed posture of the limbs drawn tightly toward the torso.',
        whyItMatters: 'Proper fetal flexion presents the smallest skull diameter to the pelvic inlet during labor.'
      }
    ]
  }
];

export const ATTRIBUTION_DATA = [
  {
    experience: "Female Reproductive System 3D Model",
    author: "Medical Anatomy Asset",
    source: "Creative Commons Attribution License (CC BY 4.0)",
    license: "CC BY 4.0 Educational Usage"
  },
  {
    experience: "Bony Pelvis & Pelvic Organs from MRI",
    author: "Clinical MRI Anatomy Reconstruction",
    source: "Educational Medical Research Data (Draco Web-Optimized Asset: 3.65 MB)",
    license: "CC BY 4.0 Educational Usage"
  },
  {
    experience: "Fetal Position & Fetus Visualization",
    author: "Sketchfab 3D Model — Fetus Asset",
    source: "Creative Commons Attribution License (CC BY 4.0 - Draco Web-Optimized Asset: 0.94 MB)",
    license: "CC BY 4.0 Educational Usage"
  }
];
